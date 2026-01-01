import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { randomUUID } from "node:crypto";
import { createNotification } from "@/lib/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei übergeben" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const storage = getRailwayStorage();

    let ext = file.name.split(".").pop()?.toLowerCase() || "";
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;

    // Convert HEIC/HEIF to JPEG
    const magicBytes = buffer.length > 12 ? buffer.toString("utf8", 4, 12) : "";
    const isHeic = ext === "heic" || ext === "heif" || 
                   mimeType.includes("heic") || mimeType.includes("heif") ||
                   magicBytes.includes("ftyp") || magicBytes.includes("heic") || magicBytes.includes("mif1");
    
    if (isHeic) {
      console.log("Converting HEIC image to JPEG...");
      try {
        const convertedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        buffer = Buffer.from(convertedBuffer);
        mimeType = "image/jpeg";
        ext = "jpg";
      } catch (convErr) {
        console.error("HEIC conversion failed:", convErr);
      }
    }

    const storagePath = `documents/uploads/${randomUUID()}.${ext}`;
    const thumbnailPath = `documents/thumbnails/${randomUUID()}.${ext}`;

    // Upload to Railway Storage Bucket
    const { error: uploadError } = await storage.upload(storagePath, buffer, {
      contentType: mimeType,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Generate and upload thumbnail for images
    let thumbnailStoragePath: string | null = null;
    if (mimeType.startsWith("image/")) {
      try {
        const thumbnail = await sharp(buffer)
          .resize(400, 400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        await storage.upload(thumbnailPath, thumbnail, { contentType: "image/jpeg" });
        thumbnailStoragePath = thumbnailPath;
      } catch (thumbErr) {
        console.error("Thumbnail generation failed:", thumbErr);
      }
    }

    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    // Insert document first (quick response to user)
    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        storage_path: storagePath,
        thumbnail_path: thumbnailStoragePath,
        mime_type: mimeType,
        size_bytes: buffer.length,
        workspace_id: workspaceId || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger async AI analysis for all media types
    // Add random delay (0-3s) to stagger API calls and avoid rate limits
    const randomDelay = Math.floor(Math.random() * 3000);
    setTimeout(() => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/documents/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: inserted.id, quality: "standard" }),
      }).catch((err) => console.error("Failed to trigger processing:", err));
    }, randomDelay);

    // Create notification for upload
    const session = await getServerSession(authOptions);
    if (session?.user && workspaceId) {
      const userId = (session.user as any).id;
      const fileType = isImage ? "Image" : isVideo ? "Video" : 
                       mimeType === "application/pdf" ? "PDF" : "File";
      await createNotification({
        userId,
        workspaceId,
        title: `${fileType} uploaded`,
        message: file.name,
        type: "success",
        actionType: "upload",
        link: `/workspace/${workspaceId}/document/${inserted.id}`,
        metadata: { 
          fileName: file.name, 
          fileType: mimeType, 
          fileSize: buffer.length,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        document: inserted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Upload" },
      { status: 500 }
    );
  }
}
