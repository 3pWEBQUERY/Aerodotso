import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - List chapters for a link
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
    .from("link_chapters")
    .select("*")
    .eq("link_id", linkId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }

  return NextResponse.json({ chapters: data });
}

// POST - Create a new chapter
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const { title, start_time, end_time, description } = await req.json();

  if (!title || start_time === undefined) {
    return NextResponse.json({ error: "Title and start_time required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("link_chapters")
    .insert({
      link_id: linkId,
      title,
      start_time,
      end_time: end_time || null,
      description: description || null,
      is_ai_generated: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }

  return NextResponse.json({ chapter: data });
}
