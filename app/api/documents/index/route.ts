import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { documentSearchSchema } from "@/lib/validation";

/**
 * POST /api/documents/index
 * Semantic search through user's documents using vector similarity
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = documentSearchSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, limit = 10 } = parseResult.data;

    // Generate embedding for the search query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedQuery(query);
    } catch (embeddingError) {
      console.error("Embedding generation failed:", embeddingError);
      return NextResponse.json(
        { error: "Fehler bei der Suchanfrage-Verarbeitung" },
        { status: 500 }
      );
    }

    // Perform vector similarity search using Supabase RPC
    const { data: results, error: searchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_count: limit,
        user_id: user.id,
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      
      // Fallback to text search if vector search fails
      const { data: textResults, error: textError } = await supabase
        .from("documents")
        .select("id, title, type, subject, topic, created_at")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`)
        .limit(limit);

      if (textError) {
        return NextResponse.json(
          { error: "Suche fehlgeschlagen" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        results: textResults.map((doc) => ({
          document_id: doc.id,
          title: doc.title,
          type: doc.type,
          subject: doc.subject,
          topic: doc.topic,
          similarity: 0,
          search_type: "text",
        })),
        search_type: "text",
      });
    }

    // Enrich results with document metadata
    const documentIds = results.map((r: { document_id: string }) => r.document_id);
    
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, type, subject, topic, created_at")
      .in("id", documentIds);

    const documentsMap = new Map(
      documents?.map((doc) => [doc.id, doc]) || []
    );

    const enrichedResults = results.map((result: { document_id: string; content: string; similarity: number }) => ({
      ...result,
      document: documentsMap.get(result.document_id),
      search_type: "semantic",
    }));

    return NextResponse.json({
      results: enrichedResults,
      query,
      search_type: "semantic",
    });
  } catch (error) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/index
 * Get all indexed documents for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    // Get indexed documents count
    const { count: totalCount } = await supabase
      .from("document_embeddings")
      .select("document_id", { count: "exact", head: true })
      .eq("documents.user_id", user.id);

    // Get indexed document IDs
    const { data: embeddings, error } = await supabase
      .from("document_embeddings")
      .select("document_id")
      .range(offset, offset + pageSize - 1);

    if (error) {
      return NextResponse.json(
        { error: "Fehler beim Laden der indexierten Dokumente" },
        { status: 500 }
      );
    }

    const documentIds = [...new Set(embeddings?.map((e) => e.document_id) || [])];

    // Get document details
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, type, subject, topic, created_at, updated_at")
      .in("id", documentIds)
      .eq("user_id", user.id);

    return NextResponse.json({
      documents: documents || [],
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Index GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
