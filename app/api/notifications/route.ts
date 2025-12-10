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

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, link, created_at")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(20);

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
