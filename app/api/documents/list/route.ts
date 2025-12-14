import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

// Liefert Dokumente gefiltert nach Workspace

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get workspaceId from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    let query = supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Filter by workspace if provided
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const docs = data ?? [];

    // Get Railway Storage for signed URLs
    const storage = getRailwayStorage();
    
    const withPreviews = await Promise.all(
      docs.map(async (doc: any) => {
        let previewUrl: string | null = null;

        // Generate preview URL for images, videos AND PDFs from Railway Storage
        if (
          typeof doc.mime_type === "string" &&
          (doc.mime_type.startsWith("image/") ||
            doc.mime_type.startsWith("video/") ||
            doc.mime_type === "application/pdf")
        ) {
          const { signedUrl } = await storage.createSignedUrl(doc.storage_path, 60 * 60);

          if (signedUrl) {
            previewUrl = signedUrl;
          }
        }

        return {
          ...doc,
          previewUrl,
        };
      })
    );

    return NextResponse.json({ documents: withPreviews }, { status: 200 });
  } catch (error) {
    console.error("List documents error", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Laden der Dokumente" },
      { status: 500 }
    );
  }
}
