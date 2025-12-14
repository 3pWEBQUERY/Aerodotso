import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Workspace {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string | null;
}

export async function getOrCreateWorkspaceForUser(
  userId: string
): Promise<Workspace> {
  const supabase = createSupabaseServerClient();

  // First, check for workspaces the user owns
  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from("workspaces")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (ownedError) {
    console.error("Error loading owned workspaces", ownedError);
  }

  if (ownedWorkspaces && ownedWorkspaces.length > 0) {
    return ownedWorkspaces[0] as Workspace;
  }

  // Check for workspaces the user is a member of
  const { data: memberWorkspaces, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces:workspace_id(id, user_id, name, created_at)")
    .eq("user_id", userId)
    .limit(1);

  if (memberError) {
    console.error("Error loading member workspaces", memberError);
  }

  if (memberWorkspaces && memberWorkspaces.length > 0 && memberWorkspaces[0].workspaces) {
    const ws = memberWorkspaces[0].workspaces as any;
    return {
      id: ws.id,
      user_id: ws.user_id,
      name: ws.name,
      created_at: ws.created_at,
    } as Workspace;
  }

  // Get user email for workspace name
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  const userName = user?.email?.split("@")[0] || "My";

  // Create new workspace
  const { data: inserted, error: insertError } = await supabase
    .from("workspaces")
    .insert({ 
      user_id: userId,
      name: `${userName}'s Workspace`
    })
    .select("id, user_id, name, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("Error creating workspace", insertError);
    throw new Error(insertError?.message ?? "Konnte Workspace nicht erstellen");
  }

  return inserted as Workspace;
}
