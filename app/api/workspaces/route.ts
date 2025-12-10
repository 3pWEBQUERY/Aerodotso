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
  const supabase = createSupabaseServerClient();

  // Get workspaces the user owns
  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from("workspaces")
    .select("id, name, created_at")
    .eq("user_id", userId);

  // Get workspaces the user is a member of
  const { data: memberWorkspaces, error: memberError } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspaces (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", userId);

  if (ownedError) {
    console.error("Error fetching owned workspaces:", ownedError);
  }
  if (memberError) {
    console.error("Error fetching member workspaces:", memberError);
  }

  const owned = (ownedWorkspaces || []).map((w) => ({
    id: w.id,
    name: w.name || "My Workspace",
    role: "owner" as const,
    isOwner: true,
  }));

  const member = (memberWorkspaces || [])
    .filter((m: any) => m.workspaces)
    .map((m: any) => ({
      id: m.workspaces.id,
      name: m.workspaces.name || "Workspace",
      role: m.role,
      isOwner: false,
    }));

  // Combine and deduplicate
  const allWorkspaces = [...owned];
  member.forEach((m) => {
    if (!allWorkspaces.find((w) => w.id === m.id)) {
      allWorkspaces.push(m);
    }
  });

  return NextResponse.json({ workspaces: allWorkspaces });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { name } = await request.json();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      user_id: userId,
      name: name || "New Workspace",
    })
    .select("id, name")
    .single();

  if (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  return NextResponse.json({ workspace: data });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { workspaceId, name } = await request.json();
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

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId)
    .select("id, name")
    .single();

  if (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }

  return NextResponse.json({ workspace: data });
}
