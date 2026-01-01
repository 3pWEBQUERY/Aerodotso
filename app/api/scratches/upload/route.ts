import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeImageWithGemini, generateNoteFromImage } from "@/lib/gemini-analyzer";
import sharp from "sharp";

/**
 * POST /api/scratches/upload
 * Upload an image as a scratch, analyze with Gemini, and auto-create a note
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const storage = getRailwayStorage();

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;
    let ext = file.name.split(".").pop()?.toLowerCase() || "png";

    // Convert HEIC/HEIF to JPEG (browsers can't display HEIC)
    const magicBytes = buffer.length > 12 ? buffer.toString("utf8", 4, 12) : "";
    const isHeic = ext === "heic" || ext === "heif" || 
                   mimeType.includes("heic") || mimeType.includes("heif") ||
                   magicBytes.includes("ftyp") || magicBytes.includes("heic") || magicBytes.includes("mif1");
    
    if (isHeic) {
      console.log("Converting HEIC image to JPEG...");
      try {
        const convertedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        buffer = convertedBuffer;
        mimeType = "image/jpeg";
        ext = "jpg";
        console.log("HEIC converted to JPEG, new size:", buffer.length);
      } catch (convErr) {
        console.error("HEIC conversion failed:", convErr);
        return NextResponse.json({ error: "Failed to convert HEIC image" }, { status: 500 });
      }
    }

    // Generate storage path
    const storagePath = `scratches/uploads/${randomUUID()}.${ext}`;
    const thumbnailPath = `scratches/thumbnails/${randomUUID()}.${ext}`;
    const base64Image = buffer.toString("base64");

    // Upload original to Railway Storage
    const { error: uploadError } = await storage.upload(storagePath, buffer, {
      contentType: mimeType,
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Upload thumbnail (same as original for now, could resize later)
    await storage.upload(thumbnailPath, buffer, {
      contentType: mimeType,
    });

    // Get signed URL for the uploaded image
    const { signedUrl } = await storage.createSignedUrl(storagePath, 3600);

    // Analyze image with Gemini
    let analysisResult = null;
    let searchableText = "";
    let tags: string[] = [];

    try {
      console.log("Starting Gemini analysis for uploaded image...");
      analysisResult = await analyzeImageWithGemini(base64Image, file.type);
      console.log("Gemini analysis completed:", analysisResult?.description);
      searchableText = analysisResult.searchableText;
      tags = analysisResult.tags;
    } catch (analysisError: any) {
      console.error("Gemini analysis failed:", analysisError?.message || analysisError);
      // Continue without analysis - we still want to save the scratch
      // Set default values
      searchableText = file.name;
      tags = [];
    }

    // Create scratch record
    const scratchData = {
      elements: [],
      uploadedImage: {
        storagePath,
        thumbnailPath,
        mimeType, // Use converted mimeType (JPEG if was HEIC)
        originalName: file.name,
        size: buffer.length,
      },
      analysis: analysisResult,
    };

    const { data: scratch, error: scratchError } = await supabase
      .from("scratches")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        title: analysisResult?.description?.slice(0, 100) || file.name.replace(/\.[^/.]+$/, ""),
        data: scratchData,
        thumbnail: null, // Thumbnail wird dynamisch aus data.uploadedImage.storagePath geladen
        searchable_text: searchableText,
        tags: tags,
      })
      .select()
      .single();

    if (scratchError) {
      console.error("Scratch insert error:", scratchError);
      return NextResponse.json({ error: "Failed to create scratch" }, { status: 500 });
    }

    // Auto-create a note from the image
    let note = null;
    try {
      console.log("Generating note from image...");
      const noteResult = await generateNoteFromImage(base64Image, file.type, analysisResult || undefined);
      console.log("Note generation completed:", noteResult?.title);
      
      // Convert markdown-style content to HTML for TipTap
      const contentLines = noteResult.content.split('\n').filter((line: string) => line.trim());
      const htmlParagraphs = contentLines.map((line: string) => {
        // Convert markdown headers to HTML
        if (line.startsWith('### ')) {
          return `<h3>${line.slice(4)}</h3>`;
        }
        if (line.startsWith('## ')) {
          return `<h2>${line.slice(3)}</h2>`;
        }
        if (line.startsWith('# ')) {
          return `<h1>${line.slice(2)}</h1>`;
        }
        // Convert bold markdown to HTML
        let htmlLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Remove bullet points but keep content
        htmlLine = htmlLine.replace(/^[-*•]\s*/, '');
        return `<p>${htmlLine}</p>`;
      });
      
      const noteContent = htmlParagraphs.join('');

      const { data: createdNote, error: noteError } = await supabase
        .from("notes")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          title: noteResult.title,
          content: noteContent,
          searchable_text: `${noteResult.title} ${noteResult.content} ${noteResult.tags.join(" ")}`.toLowerCase(),
          tags: noteResult.tags,
          source_scratch_id: scratch.id,
        })
        .select()
        .single();

      if (!noteError) {
        note = createdNote;
      } else {
        console.error("Note creation error:", noteError);
      }
    } catch (noteGenError) {
      console.error("Note generation failed:", noteGenError);
      // Continue without note - scratch was still created
    }

    return NextResponse.json({
      success: true,
      scratch: {
        ...scratch,
        thumbnailUrl: signedUrl,
      },
      note,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Scratch upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
