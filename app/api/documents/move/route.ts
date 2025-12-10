import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH: Move documents to a folder
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds, folderId } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Document IDs required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("documents")
      .update({ folder_id: folderId || null })
      .in("id", documentIds)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data }, { status: 200 });
  } catch (error) {
    console.error("Move documents error", error);
    return NextResponse.json({ error: "Failed to move documents" }, { status: 500 });
  }
}
