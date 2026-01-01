import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

// POST - Resolve document IDs to fresh signed URLs
// Used by canvas to get fresh URLs for media nodes with expired signed URLs

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "documentIds array required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const storage = getRailwayStorage();

    // Fetch documents by IDs
    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, storage_path, mime_type")
      .in("id", documentIds);

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // Generate fresh signed URLs for each document
    const urlMap: Record<string, string> = {};

    await Promise.all(
      (documents || []).map(async (doc) => {
        if (doc.storage_path) {
          // Generate signed URL valid for 1 hour
          const { signedUrl } = await storage.createSignedUrl(doc.storage_path, 60 * 60);
          if (signedUrl) {
            urlMap[doc.id] = signedUrl;
          }
        }
      })
    );

    return NextResponse.json({ urls: urlMap });
  } catch (error) {
    console.error("Resolve URLs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
