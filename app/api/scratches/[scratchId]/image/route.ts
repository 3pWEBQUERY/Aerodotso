import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

// GET - Proxy the uploaded image (public endpoint for img tags)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scratchId: string }> }
) {
  const { scratchId } = await params;
  const supabase = createSupabaseServerClient();
  const storage = getRailwayStorage();

  const { data, error } = await supabase
    .from("scratches")
    .select("data")
    .eq("id", scratchId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Scratch not found" }, { status: 404 });
  }

  const storagePath = data.data?.uploadedImage?.storagePath;
  console.log("Image API - scratchId:", scratchId);
  console.log("Image API - storagePath:", storagePath);
  console.log("Image API - data.data:", JSON.stringify(data.data, null, 2));
  
  if (!storagePath) {
    console.error("No storagePath found in scratch data");
    return NextResponse.json({ error: "No uploaded image" }, { status: 404 });
  }

  try {
    // Download the image from storage
    console.log("Downloading image from:", storagePath);
    const { data: imageData, error: downloadError } = await storage.download(storagePath);
    
    if (downloadError || !imageData) {
      console.error("Failed to download image:", downloadError);
      return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
    }

    // Get the mime type from the stored data
    const mimeType = data.data?.uploadedImage?.mimeType || "image/jpeg";

    // Return the image with proper headers
    const uint8Array = new Uint8Array(imageData);
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Error serving image:", err);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}
