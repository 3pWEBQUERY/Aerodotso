import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, user_id, avatar_url, created_at")
    .eq("id", workspaceId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({ workspace: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const userId = (session.user as any).id;
  const supabase = createSupabaseServerClient();

  // Check if user is the owner
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("user_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace || workspace.user_id !== userId) {
    return NextResponse.json({ error: "Not authorized to delete this workspace" }, { status: 403 });
  }

  // Delete the workspace (cascade will handle members, invitations, documents)
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
