import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/documents/reprocess
 * Reprocess documents with the new multi-model analyzer
 * Can process a single document or batch process all in a workspace
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { documentId, workspaceId, quality = "standard", limit = 50 } = await req.json();

    if (!documentId && !workspaceId) {
      return NextResponse.json(
        { error: "Either documentId or workspaceId is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const processedIds: string[] = [];
    const errors: { id: string; error: string }[] = [];

    if (documentId) {
      // Reprocess single document
      try {
        const response = await fetch(`${baseUrl}/api/documents/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, quality }),
        });

        if (response.ok) {
          processedIds.push(documentId);
        } else {
          errors.push({ id: documentId, error: await response.text() });
        }
      } catch (error: any) {
        errors.push({ id: documentId, error: error.message });
      }
    } else if (workspaceId) {
      // Batch reprocess all images in workspace
      const { data: documents, error: fetchError } = await supabase
        .from("documents")
        .select("id, mime_type, processed_at")
        .eq("workspace_id", workspaceId)
        .like("mime_type", "image/%")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        return NextResponse.json(
          { error: "Failed to fetch documents" },
          { status: 500 }
        );
      }

      // Process documents with delay to avoid rate limits
      for (const doc of documents || []) {
        try {
          // Add delay between requests (2-4 seconds random)
          const delay = 2000 + Math.random() * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));

          const response = await fetch(`${baseUrl}/api/documents/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: doc.id, quality }),
          });

          if (response.ok) {
            processedIds.push(doc.id);
            console.log(`Reprocessed ${doc.id} (${processedIds.length}/${documents?.length})`);
          } else {
            errors.push({ id: doc.id, error: `HTTP ${response.status}` });
          }
        } catch (error: any) {
          errors.push({ id: doc.id, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedIds.length,
      errors: errors.length,
      processedIds,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("Reprocess error:", error);
    return NextResponse.json(
      { error: "Reprocessing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/reprocess?workspaceId=...
 * Get status of documents that need reprocessing
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Count documents that need reprocessing (no detailed_analysis)
    const { data: needsProcessing, error: countError } = await supabase
      .from("documents")
      .select("id, title, mime_type, processed_at, analysis_model", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .like("mime_type", "image/%")
      .is("detailed_analysis", null);

    const { data: alreadyProcessed } = await supabase
      .from("documents")
      .select("id", { count: "exact" })
      .eq("workspace_id", workspaceId)
      .like("mime_type", "image/%")
      .not("detailed_analysis", "is", null);

    return NextResponse.json({
      needsReprocessing: needsProcessing?.length || 0,
      alreadyProcessed: alreadyProcessed?.length || 0,
      documents: needsProcessing?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error("Reprocess status error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
