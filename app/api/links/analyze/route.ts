import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface LinkAnalysis {
  summary: string;
  keyTopics: string[];
  contentType: string;
  sentiment: string;
  tags: string[];
  language: string;
  estimatedReadTime?: string;
  modelUsed: string;
}

const LINK_ANALYSIS_PROMPT = `Du bist ein intelligenter Web-Content-Analyzer. Analysiere den folgenden Link/Content und extrahiere wichtige Informationen.

Gib das Ergebnis als JSON-Objekt zurück:
{
  "summary": "Eine prägnante Zusammenfassung des Inhalts (2-3 Sätze)",
  "keyTopics": ["Hauptthema 1", "Hauptthema 2", ...],
  "contentType": "article|video|social_post|product|documentation|news|blog|podcast|other",
  "sentiment": "positive|neutral|negative|mixed",
  "tags": ["relevant", "keywords", "for", "search"],
  "language": "de|en|...",
  "estimatedReadTime": "X min" (nur für Artikel)
}

Sei präzise und extrahiere die wichtigsten Informationen.
Ausgabe NUR das JSON, keine Erklärung.`;

// Analyze link with Gemini Flash (fast)
async function analyzeWithGeminiFlash(url: string, title: string, description?: string): Promise<LinkAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.log("Gemini API key not configured");
    return null;
  }

  try {
    const content = `URL: ${url}\nTitle: ${title}\nDescription: ${description || "N/A"}`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: LINK_ANALYSIS_PROMPT },
              { text: content }
            ]
          }],
          generationConfig: { maxOutputTokens: 2048 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean and parse JSON
    let cleanContent = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    return {
      ...parsed,
      modelUsed: "gemini-3-flash-preview",
    };
  } catch (error) {
    console.error("Gemini Flash analysis failed:", error);
    return null;
  }
}

// Analyze link with Gemini Pro (detailed)
async function analyzeWithGeminiPro(url: string, title: string, description?: string): Promise<LinkAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.log("Gemini API key not configured");
    return null;
  }

  try {
    const content = `URL: ${url}\nTitle: ${title}\nDescription: ${description || "N/A"}`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: LINK_ANALYSIS_PROMPT },
              { text: content }
            ]
          }],
          generationConfig: { maxOutputTokens: 4096 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean and parse JSON
    let cleanContent = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    return {
      ...parsed,
      modelUsed: "gemini-3-pro-preview",
    };
  } catch (error) {
    console.error("Gemini Pro analysis failed:", error);
    return null;
  }
}

// POST - Analyze a link with Gemini
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title, description, model = "flash" } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  let analysis: LinkAnalysis | null = null;

  if (model === "pro") {
    analysis = await analyzeWithGeminiPro(url, title || url, description);
  } else {
    analysis = await analyzeWithGeminiFlash(url, title || url, description);
  }

  if (!analysis) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }

  return NextResponse.json({ analysis });
}
