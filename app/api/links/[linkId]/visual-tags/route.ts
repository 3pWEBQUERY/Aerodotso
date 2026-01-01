import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - List visual tags for a link
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
    .from("link_visual_tags")
    .select("*")
    .eq("link_id", linkId)
    .order("confidence", { ascending: false, nullsFirst: false })
    .order("first_appearance", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching visual tags:", error);
    return NextResponse.json({ error: "Failed to fetch visual tags" }, { status: 500 });
  }

  return NextResponse.json({ tags: data });
}
