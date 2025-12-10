import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { callLLM } from "@/lib/llm";
import { chatMessageSchema } from "@/lib/validation";

/**
 * POST /api/chat
 * KI-Chat mit semantischer Suche über Nutzerdokumente
 * 
 * Ablauf:
 * 1. Frage kommt rein
 * 2. Embedding-Suche liefert relevante Dokumentausschnitte
 * 3. Diese Snippets werden als Kontext an das LLM übergeben
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Authentifizierung prüfen
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht autorisiert. Bitte einloggen." },
        { status: 401 }
      );
    }

    // Request validieren
    const body = await req.json();
    const parseResult = chatMessageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { question, documentId } = parseResult.data;

    // Kontext aus Dokumenten holen (via Vektor-Suche)
    let context = "";
    let contextUsed: Array<{ document_id: string; content: string; similarity: number }> = [];

    try {
      const queryEmbedding = await embedQuery(question);

      // Suche nur in spezifischem Dokument oder allen Dokumenten des Users
      const rpcParams: Record<string, unknown> = {
        query_embedding: queryEmbedding,
        match_count: 8,
        user_id: user.id,
      };

      const { data: matches, error: searchError } = await supabase.rpc(
        "match_documents",
        rpcParams
      );

      if (!searchError && matches && matches.length > 0) {
        // Optional: Filtern nach documentId wenn angegeben
        const filteredMatches = documentId
          ? matches.filter((m: { document_id: string }) => m.document_id === documentId)
          : matches;

        contextUsed = filteredMatches;
        context = filteredMatches
          .map((m: { content: string }) => m.content)
          .join("\n---\n")
          .slice(0, 8000); // Sicherheitslimit
      }
    } catch (embeddingError) {
      // Embedding/Suche fehlgeschlagen - trotzdem mit LLM antworten (ohne Kontext)
      console.warn("Embedding search failed, continuing without context:", embeddingError);
    }

    // LLM aufrufen
    const apiKey = process.env.LLM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "LLM_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    let answer: string;

    try {
      answer = await callLLM({
        prompt: question,
        context: context || "Kein spezifischer Kontext verfügbar.",
      });
    } catch (llmError) {
      console.error("LLM call failed:", llmError);
      return NextResponse.json(
        { error: "Fehler beim Aufruf des KI-Modells." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
      contextUsed: contextUsed.length > 0 ? contextUsed : undefined,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Interner Fehler in der Chat-API." },
      { status: 500 }
    );
  }
}
