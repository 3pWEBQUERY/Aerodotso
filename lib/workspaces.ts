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

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Error loading workspace", error);
  }

  if (data && data.length > 0) {
    return data[0] as Workspace;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("workspaces")
    .insert({ user_id: userId })
    .select("id, user_id, name, created_at")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Konnte Workspace nicht erstellen");
  }

  return inserted as Workspace;
}
