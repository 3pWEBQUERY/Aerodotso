import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

// GET - List scratches for a workspace
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const storage = getRailwayStorage();

  const { data, error } = await supabase
    .from("scratches")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scratches:", error);
    return NextResponse.json({ error: "Failed to fetch scratches" }, { status: 500 });
  }

  // Load thumbnails as base64 data URLs
  const scratchesWithUrls = await Promise.all(
    (data || []).map(async (scratch) => {
      let thumbnailDataUrl = null;
      
      // Load thumbnail from storage if there's an uploaded image
      // Use storagePath as thumbnail (same image for now)
      const imagePath = scratch.data?.uploadedImage?.storagePath;
      console.log("Scratch", scratch.id, "- imagePath:", imagePath);
      
      if (imagePath) {
        try {
          const { data: imageData, error: downloadError } = await storage.download(imagePath);
          if (!downloadError && imageData) {
            const mimeType = scratch.data?.uploadedImage?.mimeType || "image/jpeg";
            const base64 = imageData.toString("base64");
            thumbnailDataUrl = `data:${mimeType};base64,${base64}`;
            console.log("Thumbnail loaded for scratch", scratch.id, "size:", base64.length);
          } else {
            console.error("Error downloading thumbnail:", downloadError);
          }
        } catch (err) {
          console.error("Error loading thumbnail:", err);
        }
      }
      
      return {
        ...scratch,
        thumbnail: thumbnailDataUrl,
      };
    })
  );

  return NextResponse.json({ scratches: scratchesWithUrls });
}

// POST - Create a new scratch
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { workspaceId, title, data, folder_id } = await req.json();

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const insertData: Record<string, any> = {
    workspace_id: workspaceId,
    user_id: userId,
    title: title || "Untitled Scratch",
    data: data || { elements: [], appState: {} },
  };

  if (folder_id) {
    insertData.folder_id = folder_id;
  }

  const { data: scratch, error } = await supabase
    .from("scratches")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating scratch:", error);
    return NextResponse.json({ error: "Failed to create scratch" }, { status: 500 });
  }

  return NextResponse.json({ scratch });
}
