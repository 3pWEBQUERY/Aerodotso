import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Get comments for a link
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("link_comments")
    .select(`
      *,
      user:users(name, avatar_url)
    `)
    .eq("link_id", linkId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }

  return NextResponse.json({ comments: data || [] });
}

// POST - Create a comment for a link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { linkId } = await params;
  const { content, timestamp_seconds, frame_data } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("link_comments")
    .insert({
      link_id: linkId,
      user_id: userId,
      content: content.trim(),
      timestamp_seconds: timestamp_seconds || null,
      frame_data: frame_data || null,
    })
    .select(`
      *,
      user:users(name, avatar_url)
    `)
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}
