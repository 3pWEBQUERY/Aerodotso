import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Get a single canvas by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canvasId } = await params;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", canvasId)
    .single();

  if (error) {
    console.error("Error fetching canvas:", error);
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }

  return NextResponse.json({ canvas: data });
}

// PATCH - Update a canvas
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canvasId } = await params;
  const body = await req.json();
  const supabase = createSupabaseServerClient();

  const updateData: any = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.data !== undefined) updateData.data = body.data;

  const { data, error } = await supabase
    .from("canvases")
    .update(updateData)
    .eq("id", canvasId)
    .select()
    .single();

  if (error) {
    console.error("Error updating canvas:", error);
    return NextResponse.json({ error: "Failed to update canvas" }, { status: 500 });
  }

  return NextResponse.json({ canvas: data });
}

// DELETE - Delete a canvas
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ canvasId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canvasId } = await params;
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", canvasId);

  if (error) {
    console.error("Error deleting canvas:", error);
    return NextResponse.json({ error: "Failed to delete canvas" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
