import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationActionType = 
  | "upload"
  | "folder_create"
  | "folder_delete"
  | "folder_rename"
  | "document_delete"
  | "note_create"
  | "note_delete"
  | "link_create"
  | "link_delete"
  | "canvas_create"
  | "canvas_delete"
  | "member_join"
  | "member_leave"
  | "general";

export interface CreateNotificationParams {
  userId: string;
  workspaceId?: string;
  title: string;
  message?: string;
  type?: "info" | "success" | "warning" | "error";
  actionType?: NotificationActionType;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  workspaceId,
  title,
  message,
  type = "info",
  actionType = "general",
  link,
  metadata = {},
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      workspace_id: workspaceId || null,
      title,
      message: message || null,
      type,
      action_type: actionType,
      link: link || null,
      metadata,
      is_read: false,
    });

    if (error) {
      console.error("Failed to create notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function createWorkspaceNotification({
  workspaceId,
  title,
  message,
  type = "info",
  actionType = "general",
  link,
  metadata = {},
}: Omit<CreateNotificationParams, "userId"> & { workspaceId: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();

    // Get all members of the workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("user_id")
      .eq("id", workspaceId)
      .single();

    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId);

    const userIds = new Set<string>();
    if (workspace?.user_id) userIds.add(workspace.user_id);
    members?.forEach((m) => userIds.add(m.user_id));

    // Create notification for each user
    const notifications = Array.from(userIds).map((userId) => ({
      user_id: userId,
      workspace_id: workspaceId,
      title,
      message: message || null,
      type,
      action_type: actionType,
      link: link || null,
      metadata,
      is_read: false,
    }));

    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Failed to create workspace notifications:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating workspace notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}
