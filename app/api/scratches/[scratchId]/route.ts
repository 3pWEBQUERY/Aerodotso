import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

// GET - Get a single scratch
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scratchId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scratchId } = await params;
  const supabase = createSupabaseServerClient();
  const storage = getRailwayStorage();

  const { data, error } = await supabase
    .from("scratches")
    .select("*")
    .eq("id", scratchId)
    .single();

  if (error || !data) {
    console.error("Error fetching scratch:", error);
    return NextResponse.json({ error: "Scratch not found" }, { status: 404 });
  }

  // Load uploaded image as base64 data URL
  let uploadedImageDataUrl = null;
  
  if (data.data?.uploadedImage?.storagePath) {
    try {
      const { data: imageData, error: downloadError } = await storage.download(
        data.data.uploadedImage.storagePath
      );
      
      if (!downloadError && imageData) {
        const mimeType = data.data.uploadedImage.mimeType || "image/jpeg";
        const base64 = imageData.toString("base64");
        uploadedImageDataUrl = `data:${mimeType};base64,${base64}`;
        console.log("Image loaded as data URL, size:", base64.length);
      } else {
        console.error("Failed to download image:", downloadError);
      }
    } catch (err) {
      console.error("Error loading image:", err);
    }
  }

  return NextResponse.json({ 
    scratch: {
      ...data,
      uploadedImageDataUrl,
    }
  });
}

// PATCH - Update a scratch
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scratchId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scratchId } = await params;
  const { title, data, is_starred, folder_id, thumbnail } = await req.json();
  const supabase = createSupabaseServerClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (data !== undefined) updateData.data = data;
  if (is_starred !== undefined) updateData.is_starred = is_starred;
  if (folder_id !== undefined) updateData.folder_id = folder_id;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

  const { data: scratch, error } = await supabase
    .from("scratches")
    .update(updateData)
    .eq("id", scratchId)
    .select()
    .single();

  if (error) {
    console.error("Error updating scratch:", error);
    return NextResponse.json({ error: "Failed to update scratch" }, { status: 500 });
  }

  return NextResponse.json({ scratch });
}

// DELETE - Delete a scratch
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ scratchId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scratchId } = await params;
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("scratches")
    .delete()
    .eq("id", scratchId);

  if (error) {
    console.error("Error deleting scratch:", error);
    return NextResponse.json({ error: "Failed to delete scratch" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
