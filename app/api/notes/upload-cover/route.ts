import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const noteId = formData.get("noteId") as string;

    if (!file || !noteId) {
      return NextResponse.json(
        { error: "File and noteId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Verify the note exists and belongs to the user's workspace
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, workspace_id")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `note-images/${noteId}/${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Railway Storage Bucket
    const storage = getRailwayStorage();
    const { error: uploadError } = await storage.upload(fileName, buffer, {
      contentType: file.type,
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get signed URL (Railway buckets are private)
    const { signedUrl, error: urlError } = await storage.createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (urlError || !signedUrl) {
      console.error("Signed URL error:", urlError);
      return NextResponse.json(
        { error: "Failed to create URL" },
        { status: 500 }
      );
    }

    const coverImageUrl = signedUrl;
    console.log("Cover image URL:", coverImageUrl);

    // Update the note with the cover image URL
    const { error: updateError } = await supabase
      .from("notes")
      .update({ 
        cover_image: coverImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", noteId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update note: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log("Successfully uploaded cover image for note:", noteId);
    return NextResponse.json({ coverImageUrl });
  } catch (error) {
    console.error("Upload cover error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
