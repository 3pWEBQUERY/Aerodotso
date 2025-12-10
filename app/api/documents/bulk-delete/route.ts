import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// DELETE: Delete multiple documents
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Document IDs required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // First get storage paths to delete files
    const { data: docs } = await supabase
      .from("documents")
      .select("storage_path")
      .in("id", documentIds);

    // Delete from storage
    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("documents").remove(paths);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("documents")
      .delete()
      .in("id", documentIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete documents error", error);
    return NextResponse.json({ error: "Failed to delete documents" }, { status: 500 });
  }
}
