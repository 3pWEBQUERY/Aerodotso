import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { randomUUID } from "node:crypto";

// Upload workspace avatar
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const workspaceId = formData.get("workspaceId") as string | null;

  if (!file || !workspaceId) {
    return NextResponse.json({ error: "No file or workspaceId provided" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Check if user owns this workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found or no access" }, { status: 404 });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `workspaces/${workspaceId}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Railway Storage Bucket
  const storage = getRailwayStorage();
  const { error: uploadError } = await storage.upload(storagePath, buffer, {
    contentType: file.type,
  });

  if (uploadError) {
    console.error("Error uploading workspace image:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get signed URL - valid for 1 year
  const { signedUrl, error: urlError } = await storage.createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (urlError || !signedUrl) {
    console.error("Error creating signed URL:", urlError);
    return NextResponse.json({ error: "Failed to create URL" }, { status: 500 });
  }

  const avatarUrl = signedUrl;

  // Update workspace record
  const { data: workspaceData, error: updateError } = await supabase
    .from("workspaces")
    .update({ avatar_url: avatarUrl })
    .eq("id", workspaceId)
    .select("id, name, avatar_url")
    .single();

  if (updateError) {
    console.error("Error updating workspace avatar:", updateError);
    return NextResponse.json({ error: "Failed to update workspace avatar" }, { status: 500 });
  }

  return NextResponse.json({ workspace: workspaceData, avatarUrl });
}
