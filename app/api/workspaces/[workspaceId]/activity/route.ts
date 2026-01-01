import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const supabase = createSupabaseServerClient();

  // Get year from query params, default to current year
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Fetch activity counts from all content types
  const [documentsRes, notesRes, linksRes, canvasRes, scratchesRes] = await Promise.all([
    // Documents
    supabase
      .from("documents")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
    // Notes
    supabase
      .from("notes")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
    // Links
    supabase
      .from("links")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
    // Canvas
    supabase
      .from("canvases")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
    // Scratches
    supabase
      .from("scratches")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
  ]);

  // Combine all activities and count by date
  const activityMap: Record<string, { count: number; details: Record<string, number> }> = {};

  const addToMap = (items: any[] | null, type: string) => {
    if (!items) return;
    items.forEach((item) => {
      const date = item.created_at.split("T")[0];
      if (!activityMap[date]) {
        activityMap[date] = { count: 0, details: {} };
      }
      activityMap[date].count += 1;
      activityMap[date].details[type] = (activityMap[date].details[type] || 0) + 1;
    });
  };

  addToMap(documentsRes.data, "uploads");
  addToMap(notesRes.data, "notes");
  addToMap(linksRes.data, "links");
  addToMap(canvasRes.data, "canvases");
  addToMap(scratchesRes.data, "scratches");

  // Convert to array format
  const activity = Object.entries(activityMap).map(([date, data]) => ({
    date,
    count: data.count,
    details: data.details,
  }));

  return NextResponse.json({ activity });
}
