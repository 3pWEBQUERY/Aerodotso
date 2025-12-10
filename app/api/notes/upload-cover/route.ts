import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const fileName = `${noteId}/${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === "note-images");
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket("note-images", {
        public: true,
      });
      if (createBucketError) {
        console.error("Create bucket error:", createBucketError);
        return NextResponse.json(
          { error: `Failed to create bucket: ${createBucketError.message}` },
          { status: 500 }
        );
      }
    }

    // Upload to Supabase Storage (note-images bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("note-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("note-images")
      .getPublicUrl(fileName);

    const coverImageUrl = urlData.publicUrl;
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
