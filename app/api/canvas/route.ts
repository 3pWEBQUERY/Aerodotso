import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - List canvases for a workspace
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

  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching canvases:", error);
    return NextResponse.json({ error: "Failed to fetch canvases" }, { status: 500 });
  }

  return NextResponse.json({ canvases: data });
}

// POST - Create a new canvas
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { workspaceId, name, folder_id } = await req.json();

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const insertData: Record<string, any> = {
    workspace_id: workspaceId,
    user_id: userId,
    name: name || "Untitled Canvas",
    data: {},
  };

  if (folder_id) {
    insertData.folder_id = folder_id;
  }

  const { data, error } = await supabase
    .from("canvases")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating canvas:", error);
    return NextResponse.json({ error: "Failed to create canvas" }, { status: 500 });
  }

  return NextResponse.json({ canvas: data });
}

// DELETE - Delete a canvas
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canvasId } = await req.json();
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", canvasId);

  if (error) {
    console.error("Error deleting canvas:", error);
    return NextResponse.json({ error: "Failed to delete canvas" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
