import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/chat/messages - Add a message to a chat session
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, role, content, browsedFiles } = await req.json();

  if (!sessionId || !role || !content) {
    return NextResponse.json({ error: "sessionId, role, and content required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      browsed_files: browsedFiles || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }

  // Update session's updated_at
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ message: data });
}

/**
 * PATCH /api/chat/messages - Update a message (rating)
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId, rating } = await req.json();

  if (!messageId) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .update({ rating })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    console.error("Error updating chat message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}

/**
 * DELETE /api/chat/messages - Delete a message
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId } = await req.json();

  if (!messageId) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("Error deleting chat message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
