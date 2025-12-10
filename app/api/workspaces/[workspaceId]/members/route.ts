import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - List all members of a workspace
export async function GET(
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

  // Check if user is member of this workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
  }

  // Get all members with user info
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select(`
      id,
      role,
      joined_at,
      user_id,
      users:user_id (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  // Transform data
  const transformedMembers = members?.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    name: m.users?.name || "Unknown",
    email: m.users?.email || "",
    avatar_url: m.users?.avatar_url,
    role: m.role,
    joined_at: m.joined_at,
    isYou: m.user_id === userId,
  })) || [];

  return NextResponse.json({ members: transformedMembers });
}

// DELETE - Remove a member from workspace
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
  const { memberId } = await req.json();
  const supabase = createSupabaseServerClient();

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Not authorized to remove members" }, { status: 403 });
  }

  // Get the member to be removed
  const { data: targetMember } = await supabase
    .from("workspace_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove the owner
  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
  }

  // Admin can only remove members and viewers, not other admins
  if (membership.role === "admin" && targetMember.role === "admin") {
    return NextResponse.json({ error: "Admins cannot remove other admins" }, { status: 403 });
  }

  // Remove the member
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
