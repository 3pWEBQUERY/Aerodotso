import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const showAll = searchParams.get("showAll") === "true";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("notifications")
    .select("id, title, message, type, is_read, link, action_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter by workspace if provided
  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  } else {
    query = query.eq("user_id", userId);
  }

  // Only show unread by default
  if (!showAll) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [] });
  }

  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { notificationId, markAllRead } = await request.json();
  const supabase = createSupabaseServerClient();

  if (markAllRead) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
  } else if (notificationId) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
  }

  return NextResponse.json({ success: true });
}
