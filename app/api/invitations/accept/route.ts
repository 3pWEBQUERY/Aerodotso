import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST - Accept an invitation (by token or for logged in user by email)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userEmail = session.user.email?.toLowerCase();
  const { token, invitationId } = await req.json();
  const supabase = createSupabaseServerClient();

  let invitation;

  if (token) {
    // Accept by token (from email link)
    const { data, error } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
    }

    invitation = data;
  } else if (invitationId) {
    // Accept by invitation ID (for logged in user matching email)
    const { data, error } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("email", userEmail)
      .eq("status", "pending")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invitation not found or not for your email" }, { status: 400 });
    }

    invitation = data;
  } else {
    return NextResponse.json({ error: "Token or invitation ID required" }, { status: 400 });
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("workspace_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", invitation.workspace_id)
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    // Update invitation status but don't error
    await supabase
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({ message: "Already a member of this workspace" });
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

  if (memberError) {
    console.error("Error adding member:", memberError);
    return NextResponse.json({ error: "Failed to join workspace" }, { status: 500 });
  }

  // Update invitation status
  await supabase
    .from("workspace_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  // Get workspace info
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", invitation.workspace_id)
    .single();

  return NextResponse.json({ 
    success: true, 
    workspace,
    message: `Successfully joined ${workspace?.name || "workspace"}` 
  });
}
