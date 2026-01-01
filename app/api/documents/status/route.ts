import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/documents/status?documentId=...
 * Check if a document has been processed (AI analysis complete)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: document, error } = await supabase
      .from("documents")
      .select("id, searchable_text, tags, description")
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("Document status query error:", error);
      return NextResponse.json(
        { error: "Document not found", details: error.message },
        { status: 404 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Document is considered processed if it has searchable_text or description
    const processed = !!(document.searchable_text || document.description);

    return NextResponse.json({
      documentId,
      processed,
      hasDescription: !!document.description,
      hasSearchableText: !!document.searchable_text,
      tagsCount: document.tags?.length || 0,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
