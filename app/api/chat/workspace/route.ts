import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Model configurations
const MODEL_CONFIG: Record<string, { provider: string; model: string }> = {
  // Eden (Best = uses the best available)
  "best": { provider: "google", model: "gemini-3-pro-preview" },
  // OpenAI
  "gpt-5.1": { provider: "openai", model: "gpt-5.1-2025-11-13" }, // GPT-5.1 mapped to latest
  "gpt-5 mini": { provider: "openai", model: "gpt-5-mini-2025-08-07" },
  "gpt-5 nano": { provider: "openai", model: "gpt-5-nano-2025-08-07" },
  // Anthropic
  "claude-haiku-4.5": { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
  "claude-sonnet-4.5": { provider: "anthropic", model: "claude-sonnet-4-5-20250929" },
  "claude-opus-4.5": { provider: "anthropic", model: "claude-opus-4-5-20251101" },
  // Google
  "gemini-3-pro": { provider: "google", model: "gemini-3-pro-preview" },
  "gemini-2.5-pro": { provider: "google", model: "gemini-2.5-pro" },
  "gemini-2.5-flash": { provider: "google", model: "gemini-2.5-flash" },
};

// API endpoints and headers per provider
async function callOpenAI(apiKey: string, systemPrompt: string, question: string, model: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

async function callAnthropic(apiKey: string, systemPrompt: string, question: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: "user", content: question },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic Error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.content[0].text;
}

async function callGemini(apiKey: string, systemPrompt: string, question: string, model: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nUser: ${question}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  return json.candidates[0].content.parts[0].text;
}

/**
 * POST /api/chat/workspace
 * AI Chat mit Workspace-Kontext - unterstützt OpenAI, Anthropic, Google
 */
export async function POST(req: NextRequest) {
  try {
    // Auth prüfen mit next-auth
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const body = await req.json();
    const { question, workspaceId, model = "best" } = body;

    if (!question || !workspaceId) {
      return NextResponse.json(
        { error: "question und workspaceId sind erforderlich" },
        { status: 400 }
      );
    }

    // Model config holen
    const modelConfig = MODEL_CONFIG[model] || MODEL_CONFIG["best"];

    // API Keys prüfen
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Workspace-Daten laden für Kontext
    const [notesRes, linksRes, docsRes, foldersRes, canvasesRes] = await Promise.all([
      supabase
        .from("notes")
        .select("id, title, content")
        .eq("workspace_id", workspaceId)
        .limit(50),
      supabase
        .from("links")
        .select("id, title, url, description, link_type")
        .eq("workspace_id", workspaceId)
        .limit(50),
      supabase
        .from("documents")
        .select("id, title, mime_type")
        .eq("workspace_id", workspaceId)
        .limit(50),
      supabase
        .from("folders")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .limit(20),
      supabase
        .from("canvases")
        .select("id, title")
        .eq("workspace_id", workspaceId)
        .limit(20),
    ]);

    // Kontext aufbauen
    const notes = notesRes.data || [];
    const links = linksRes.data || [];
    const documents = docsRes.data || [];
    const folders = foldersRes.data || [];
    const canvases = canvasesRes.data || [];

    // Detaillierte Statistiken berechnen
    const images = documents.filter((d) => d.mime_type?.startsWith("image/"));
    const pdfs = documents.filter((d) => d.mime_type === "application/pdf");
    const youtubeVideos = links.filter((l) => l.link_type === "youtube");
    const otherVideos = links.filter((l) => ["vimeo", "twitch", "tiktok", "video"].includes(l.link_type || ""));
    const websites = links.filter((l) => !["youtube", "vimeo", "twitch", "tiktok", "video"].includes(l.link_type || ""));

    const stats = {
      totalFiles: notes.length + links.length + documents.length + canvases.length,
      images: images.length,
      pdfs: pdfs.length,
      notes: notes.length,
      links: links.length,
      videos: youtubeVideos.length + otherVideos.length,
      canvases: canvases.length,
      folders: folders.length,
      websites: websites.length,
    };

    // Kontext-String erstellen mit allen Details
    let contextStr = `WORKSPACE STATISTIKEN:
- Gesamtanzahl Dateien: ${stats.totalFiles}
- Ordner: ${stats.folders}
- Bilder: ${stats.images}
- PDFs: ${stats.pdfs}
- Notizen: ${stats.notes}
- YouTube-Videos: ${youtubeVideos.length}
- Andere Videos: ${otherVideos.length}
- Websites/Links: ${stats.websites}
- Canvases: ${stats.canvases}

`;

    if (folders.length > 0) {
      contextStr += "ORDNER:\n";
      folders.forEach((f) => {
        contextStr += `- "${f.name}"\n`;
      });
      contextStr += "\n";
    }

    if (notes.length > 0) {
      contextStr += "NOTIZEN (mit Inhaltsvorschau):\n";
      notes.forEach((n) => {
        const plainContent = (n.content || "").replace(/<[^>]*>/g, "").slice(0, 150);
        contextStr += `- "${n.title}": ${plainContent}...\n`;
      });
      contextStr += "\n";
    }

    if (canvases.length > 0) {
      contextStr += "CANVASES:\n";
      canvases.forEach((c) => {
        contextStr += `- "${c.title}"\n`;
      });
      contextStr += "\n";
    }

    if (links.length > 0) {
      contextStr += "LINKS UND VIDEOS:\n";
      links.forEach((l) => {
        const typeLabel = l.link_type === "youtube" ? "YouTube" : 
                         l.link_type === "vimeo" ? "Vimeo" :
                         l.link_type === "twitch" ? "Twitch" :
                         l.link_type === "tiktok" ? "TikTok" :
                         l.link_type === "video" ? "Video" : "Website";
        contextStr += `- "${l.title}" (${typeLabel}): ${l.url}\n`;
      });
      contextStr += "\n";
    }

    if (documents.length > 0) {
      contextStr += "DOKUMENTE UND MEDIEN:\n";
      documents.forEach((d) => {
        const type = d.mime_type?.startsWith("image/")
          ? "Bild"
          : d.mime_type === "application/pdf"
          ? "PDF"
          : "Datei";
        contextStr += `- "${d.title}" (${type})\n`;
      });
    }

    // Verbesserter System Prompt für ausführliche Antworten
    const systemPrompt = `Du bist ein freundlicher und hilfreicher KI-Assistent für einen Workspace. Du hast vollständigen Zugriff auf alle Dateien, Notizen, Links und Medien des Nutzers.

WICHTIGE ANWEISUNGEN FÜR DEINE ANTWORTEN:
1. Antworte IMMER auf Deutsch
2. Sei AUSFÜHRLICH und DETAILLIERT - gib umfassende Informationen
3. Beginne mit einem einleitenden Satz, der erklärt was du tust (z.B. "Ich schaue mir deinen Workspace an...")
4. Nutze **fettgedruckte** Zahlen und wichtige Begriffe
5. Strukturiere mit Aufzählungen (nutze • für Bulletpoints)
6. Beende mit einem zusammenfassenden Satz oder hilfreichen Tipp
7. Wenn du über Dateien sprichst, nenne auch spezifische Beispiele aus dem Kontext
8. Erwähne auch Ordner wenn vorhanden (z.B. "plus X Ordner")
9. Kategorisiere die Inhalte sinnvoll (Bilder, Videos, Notizen, etc.)

BEISPIEL für eine gute Antwort auf "Wieviele Dateien habe ich?":
"Ich schaue mir deinen Workspace an, um die Anzahl der Dateien zu zählen.

Du hast insgesamt **145 Dateien** in deinem Workspace (plus 1 Ordner namens "Test").

Die Dateien verteilen sich wie folgt:

• **Bilder:** ~95 Dateien
• **Notizen:** 10 Dateien  
• **YouTube-Videos:** 6 Dateien
• **Canvases:** 3 Dateien
• **Sonstige:** 1 Datei (Welcome to Eden)

Der Großteil deines Workspaces besteht aus Bildern, gefolgt von verschiedenen Notizen und Video-Inhalten."

AKTUELLER WORKSPACE-KONTEXT:

${contextStr}`;

    // Provider-spezifischen API Call machen
    let answer: string;

    try {
      switch (modelConfig.provider) {
        case "openai":
          if (!openaiKey) {
            return NextResponse.json(
              { error: "OPENAI_API_KEY ist nicht konfiguriert" },
              { status: 500 }
            );
          }
          answer = await callOpenAI(openaiKey, systemPrompt, question, modelConfig.model);
          break;

        case "anthropic":
          if (!anthropicKey) {
            return NextResponse.json(
              { error: "ANTHROPIC_API_KEY ist nicht konfiguriert" },
              { status: 500 }
            );
          }
          answer = await callAnthropic(anthropicKey, systemPrompt, question, modelConfig.model);
          break;

        case "google":
          if (!geminiKey) {
            return NextResponse.json(
              { error: "GEMINI_API_KEY ist nicht konfiguriert" },
              { status: 500 }
            );
          }
          answer = await callGemini(geminiKey, systemPrompt, question, modelConfig.model);
          break;

        default:
          return NextResponse.json(
            { error: `Unbekannter Provider: ${modelConfig.provider}` },
            { status: 400 }
          );
      }
    } catch (llmError) {
      console.error("LLM API Error:", llmError);
      return NextResponse.json(
        { error: llmError instanceof Error ? llmError.message : "LLM Fehler" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
      browsedFiles: true,
      stats,
      model: modelConfig.model,
      provider: modelConfig.provider,
    });
  } catch (error) {
    console.error("Workspace Chat API error:", error);
    return NextResponse.json(
      { error: "Interner Fehler in der Chat-API" },
      { status: 500 }
    );
  }
}
