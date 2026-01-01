import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - List highlights for a link
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("link_highlights")
    .select("*")
    .eq("link_id", linkId)
    .order("importance", { ascending: false })
    .order("start_time", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching highlights:", error);
    return NextResponse.json({ error: "Failed to fetch highlights" }, { status: 500 });
  }

  return NextResponse.json({ highlights: data });
}

// POST - Create a new highlight
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const { start_time, end_time, text, category, importance, context } = await req.json();

  if (start_time === undefined || !text || !category) {
    return NextResponse.json({ error: "start_time, text, and category required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("link_highlights")
    .insert({
      link_id: linkId,
      start_time,
      end_time: end_time || null,
      text,
      category,
      importance: importance || 5,
      context: context || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating highlight:", error);
    return NextResponse.json({ error: "Failed to create highlight" }, { status: 500 });
  }

  return NextResponse.json({ highlight: data });
}
