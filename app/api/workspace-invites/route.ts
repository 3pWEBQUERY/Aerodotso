import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userEmail = session.user.email;
  const supabase = createSupabaseServerClient();

  // Get invites by user_id or email
  const { data, error } = await supabase
    .from("workspace_invites")
    .select(`
      id,
      workspace_id,
      status,
      created_at,
      workspaces (
        id,
        name
      ),
      invited_by_user:users!workspace_invites_invited_by_fkey (
        name,
        email
      )
    `)
    .or(`invited_user_id.eq.${userId},invited_email.eq.${userEmail}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching workspace invites:", error);
    return NextResponse.json({ invites: [] });
  }

  const invites = (data || []).map((invite: any) => ({
    id: invite.id,
    workspaceId: invite.workspace_id,
    workspaceName: invite.workspaces?.name || "Workspace",
    invitedBy: invite.invited_by_user?.name || invite.invited_by_user?.email || "Someone",
    createdAt: invite.created_at,
  }));

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { inviteId, action } = await request.json();
  const supabase = createSupabaseServerClient();

  if (action === "accept") {
    // Get the invite
    const { data: invite } = await supabase
      .from("workspace_invites")
      .select("workspace_id")
      .eq("id", inviteId)
      .single();

    if (invite) {
      // Add user to workspace members
      await supabase.from("workspace_members").insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: "member",
      });

      // Update invite status
      await supabase
        .from("workspace_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);
    }
  } else if (action === "decline") {
    await supabase
      .from("workspace_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);
  }

  return NextResponse.json({ success: true });
}
