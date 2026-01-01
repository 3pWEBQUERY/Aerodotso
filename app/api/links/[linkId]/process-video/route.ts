import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COBALT_API_URL = process.env.COBALT_API_URL; // e.g. https://cobalt-xxx.railway.app
const COBALT_API_KEY = process.env.COBALT_API_KEY;

// Extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Download video/audio using Cobalt API
async function downloadWithCobalt(
  videoUrl: string,
  format: "audio" | "video"
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!COBALT_API_URL) {
    console.error("COBALT_API_URL not configured");
    return null;
  }

  try {
    console.log(`Calling Cobalt API for ${format}:`, videoUrl);
    
    // Call Cobalt API to get download URL
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    if (COBALT_API_KEY) {
      headers["Authorization"] = `Api-Key ${COBALT_API_KEY}`;
    }

    const cobaltResponse = await fetch(`${COBALT_API_URL}/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: videoUrl,
        videoQuality: "720",
        audioFormat: "mp3",
        downloadMode: format === "audio" ? "audio" : "auto",
      }),
    });

    if (!cobaltResponse.ok) {
      const errorText = await cobaltResponse.text();
      console.error("Cobalt API error:", cobaltResponse.status, errorText);
      return null;
    }

    const cobaltData = await cobaltResponse.json();
    console.log("Cobalt response:", cobaltData);

    // Cobalt returns a URL to download the file
    if (cobaltData.status === "error") {
      console.error("Cobalt error:", cobaltData.error?.code);
      return null;
    }

    const downloadUrl = cobaltData.url || cobaltData.audio;
    if (!downloadUrl) {
      console.error("No download URL in Cobalt response");
      return null;
    }

    // Download the actual file
    console.log("Downloading from Cobalt URL:", downloadUrl);
    const fileResponse = await fetch(downloadUrl);
    
    if (!fileResponse.ok) {
      console.error("Failed to download file from Cobalt URL");
      return null;
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = fileResponse.headers.get("content-type") || 
      (format === "audio" ? "audio/mpeg" : "video/mp4");

    console.log(`Downloaded ${format}: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    return { buffer, contentType };
  } catch (error) {
    console.error("Cobalt download failed:", error);
    return null;
  }
}

// Comprehensive Gemini 3 Flash Video Analysis Prompt
const VIDEO_ANALYSIS_PROMPT = `Du bist ein fortschrittlicher Video-Analyzer. Analysiere dieses Video/Audio vollständig und gib ein umfassendes JSON-Objekt zurück.

Erstelle eine VOLLSTÄNDIGE Analyse mit folgendem Format:
{
  "transcript": [
    {"start": 0.0, "end": 5.5, "text": "Gesprochener Text", "speaker": "Speaker 1", "confidence": 0.95}
  ],
  "summary": "Eine prägnante Zusammenfassung des gesamten Inhalts (2-4 Sätze)",
  "keyTakeaways": [
    "Wichtigste Erkenntnis 1",
    "Wichtigste Erkenntnis 2",
    "Wichtigste Erkenntnis 3"
  ],
  "topics": [
    {"name": "Thema", "startTime": 0, "endTime": 60, "relevance": 0.9}
  ],
  "chapters": [
    {"title": "Einleitung", "startTime": 0, "endTime": 30, "description": "Kurze Beschreibung"}
  ],
  "highlights": [
    {
      "startTime": 45.5,
      "endTime": 52.0,
      "text": "Wichtiger Moment",
      "category": "key_point",
      "importance": 8,
      "context": "Warum ist das wichtig"
    }
  ],
  "visualTags": [
    {"tag": "Person", "category": "object", "confidence": 0.9, "firstAppearance": 0, "appearances": [{"start": 0, "end": 30}]},
    {"tag": "Büro", "category": "scene", "confidence": 0.85, "firstAppearance": 0}
  ],
  "sentiment": "positive|neutral|negative|mixed",
  "language": "de|en|...",
  "durationSeconds": 180
}

WICHTIGE REGELN:
- Transkribiere ALLE gesprochenen Worte exakt
- Erkenne verschiedene Sprecher und weise ihnen Labels zu (Speaker 1, Speaker 2, etc.)
- Zeitstempel in Sekunden mit Dezimalstellen
- Natürliche Satzgrenzen (5-15 Sekunden pro Segment)
- Highlights-Kategorien: "key_point", "action_item", "question", "decision", "important"
- Importance-Skala: 1-10 (10 = sehr wichtig)
- Visual Tags Kategorien: "object", "person", "scene", "text", "action", "emotion", "color"
- Chapters sollten logische Abschnitte sein (Einleitung, Hauptteil, etc.)

Ausgabe NUR das JSON, keine Erklärung.`;

// Internal API key for server-to-server calls
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "internal-processing-key";

// POST - Download video, analyze with Gemini 3 Flash (full analysis)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  // Check for internal API key (for server-to-server calls) or user session
  const internalKey = req.headers.get("x-internal-key");
  const isInternalCall = internalKey === INTERNAL_API_KEY;
  
  if (!isInternalCall) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { linkId } = await params;
  const supabase = createSupabaseServerClient();

  // Update processing status
  await supabase
    .from("links")
    .update({ processing_status: "processing" })
    .eq("id", linkId);

  // Get link info
  const { data: link, error: linkError } = await supabase
    .from("links")
    .select("*")
    .eq("id", linkId)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const videoId = extractYouTubeVideoId(link.url);
  if (!videoId) {
    return NextResponse.json({ error: "Not a YouTube video" }, { status: 400 });
  }

  try {
    console.log(`Processing video ${videoId} with Gemini 3 Flash...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    let audioBuffer: Buffer | null = null;
    let audioUrl: string | null = null;
    let videoUrl: string | null = null;
    
    // Step 1: Try to download audio using Cobalt API
    console.log("Step 1: Downloading audio with Cobalt API...");
    
    const audioResult = await downloadWithCobalt(link.url, "audio");
    if (audioResult) {
      audioBuffer = audioResult.buffer;
      
      // Upload audio to Railway Storage
      const audioFileName = `media/links/${linkId}/audio.mp3`;
      const storage = getRailwayStorage();
      const { error: uploadError } = await storage.upload(audioFileName, audioBuffer, {
        contentType: audioResult.contentType,
      });

      if (!uploadError) {
        const { signedUrl } = await storage.createSignedUrl(audioFileName, 60 * 60 * 24 * 365);
        audioUrl = signedUrl;
        console.log("Audio uploaded to storage:", audioUrl);
      }
    }

    // Step 2: Try to download video using Cobalt API
    console.log("Step 2: Downloading video with Cobalt API...");
    
    const videoResult = await downloadWithCobalt(link.url, "video");
    if (videoResult) {
      const videoFileName = `media/links/${linkId}/video.mp4`;
      const storage = getRailwayStorage();
      const { error: videoUploadError } = await storage.upload(videoFileName, videoResult.buffer, {
        contentType: videoResult.contentType,
      });

      if (!videoUploadError) {
        const { signedUrl: videoSignedUrl } = await storage.createSignedUrl(videoFileName, 60 * 60 * 24 * 365);
        videoUrl = videoSignedUrl;
        console.log("Video uploaded to storage:", videoUrl);
      }
    }

    // Step 3: Full Gemini 3 Flash Analysis
    console.log("Step 3: Running Gemini 3 Flash comprehensive analysis...");
    
    let analysisResult;
    
    if (audioBuffer) {
      const audioBase64 = audioBuffer.toString("base64");
      analysisResult = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/mpeg",
            data: audioBase64,
          },
        },
        { text: VIDEO_ANALYSIS_PROMPT },
      ]);
    } else {
      // Fallback: Use YouTube URL directly
      console.log("Using Gemini with YouTube URL (fallback)...");
      analysisResult = await model.generateContent([
        {
          text: `Analysiere das YouTube-Video: https://www.youtube.com/watch?v=${videoId}\n\n${VIDEO_ANALYSIS_PROMPT}`,
        },
      ]);
    }

    const responseText = analysisResult.response.text();
    console.log("Gemini 3 Flash analysis received");

    // Parse the comprehensive analysis JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Try to repair truncated JSON
      let repairedJson = jsonMatch[0];
      const openBraces = (repairedJson.match(/{/g) || []).length;
      const closeBraces = (repairedJson.match(/}/g) || []).length;
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/]/g) || []).length;
      
      for (let i = 0; i < openBrackets - closeBrackets; i++) repairedJson += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) repairedJson += '}';
      
      analysis = JSON.parse(repairedJson);
    }

    console.log(`Analysis complete: ${analysis.transcript?.length || 0} segments, ${analysis.highlights?.length || 0} highlights`);

    // Step 4: Save all data to database
    console.log("Step 4: Saving to database...");

    // Clear old data
    await Promise.all([
      supabase.from("link_transcripts").delete().eq("link_id", linkId),
      supabase.from("link_chapters").delete().eq("link_id", linkId),
      supabase.from("link_highlights").delete().eq("link_id", linkId),
      supabase.from("link_visual_tags").delete().eq("link_id", linkId),
    ]);

    // Save transcript segments
    if (analysis.transcript && analysis.transcript.length > 0) {
      const transcriptSegments = analysis.transcript.map((s: any) => ({
        link_id: linkId,
        start_time: s.start,
        end_time: s.end,
        text: s.text,
        speaker: s.speaker || null,
        confidence: s.confidence || null,
      }));
      await supabase.from("link_transcripts").insert(transcriptSegments);
    }

    // Save chapters
    if (analysis.chapters && analysis.chapters.length > 0) {
      const chapters = analysis.chapters.map((c: any) => ({
        link_id: linkId,
        title: c.title,
        start_time: c.startTime,
        end_time: c.endTime || null,
        description: c.description || null,
        is_ai_generated: true,
      }));
      await supabase.from("link_chapters").insert(chapters);
    }

    // Save highlights
    if (analysis.highlights && analysis.highlights.length > 0) {
      const highlights = analysis.highlights.map((h: any) => ({
        link_id: linkId,
        start_time: h.startTime,
        end_time: h.endTime || null,
        text: h.text,
        category: h.category || "important",
        importance: h.importance || 5,
        context: h.context || null,
      }));
      await supabase.from("link_highlights").insert(highlights);
    }

    // Save visual tags
    if (analysis.visualTags && analysis.visualTags.length > 0) {
      const visualTags = analysis.visualTags.map((t: any) => ({
        link_id: linkId,
        tag: t.tag,
        category: t.category || "object",
        confidence: t.confidence || null,
        first_appearance: t.firstAppearance || 0,
        appearances: t.appearances || [],
      }));
      await supabase.from("link_visual_tags").insert(visualTags);
    }

    // Update link with summary and metadata
    await supabase
      .from("links")
      .update({
        video_url: videoUrl,
        audio_url: audioUrl,
        ai_summary: analysis.summary || null,
        ai_key_takeaways: analysis.keyTakeaways || [],
        ai_topics: analysis.topics || [],
        ai_sentiment: analysis.sentiment || null,
        ai_duration_seconds: analysis.durationSeconds || null,
        ai_language: analysis.language || null,
        ai_analyzed_at: new Date().toISOString(),
        processing_status: "completed",
      })
      .eq("id", linkId);

    console.log(`Successfully processed video ${videoId}`);

    return NextResponse.json({
      success: true,
      videoUrl,
      audioUrl,
      summary: analysis.summary,
      keyTakeaways: analysis.keyTakeaways,
      transcriptCount: analysis.transcript?.length || 0,
      chaptersCount: analysis.chapters?.length || 0,
      highlightsCount: analysis.highlights?.length || 0,
      visualTagsCount: analysis.visualTags?.length || 0,
    });

  } catch (error) {
    console.error("Video processing failed:", error);
    
    // Update status to failed
    await supabase
      .from("links")
      .update({ processing_status: "failed" })
      .eq("id", linkId);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
