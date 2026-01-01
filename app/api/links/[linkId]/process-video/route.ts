import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import ytdl from "@distube/ytdl-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Readable } from "stream";

// Google API Key for Gemini
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Create ytdl agent with cookies to bypass 403
const agent = ytdl.createAgent(undefined, {
  localAddress: undefined,
});

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

// Convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// POST - Download video, extract audio, transcribe with Gemini
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const supabase = createSupabaseServerClient();

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
    console.log(`Processing video ${videoId}...`);

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview-exp" });
    
    let audioBuffer: Buffer | null = null;
    let audioUrl: string | null = null;
    
    // Step 1: Try to download audio from YouTube
    console.log("Step 1: Trying to download audio...");
    
    try {
      const audioStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        filter: "audioonly",
        quality: "highestaudio",
        agent,
        requestOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
          },
        },
      });
      audioBuffer = await streamToBuffer(audioStream);
      console.log(`Downloaded audio: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload audio to Railway Storage Bucket
      console.log("Step 2: Uploading to Railway Storage...");
      const audioFileName = `media/links/${linkId}/audio.webm`;
      
      const storage = getRailwayStorage();
      const { error: uploadError } = await storage.upload(audioFileName, audioBuffer, {
        contentType: "audio/webm",
      });

      if (!uploadError) {
        const { signedUrl } = await storage.createSignedUrl(audioFileName, 60 * 60 * 24 * 365);
        audioUrl = signedUrl;
        console.log(`Audio uploaded to: ${audioUrl}`);
      }
    } catch (downloadError) {
      console.error("Audio download failed, will use Gemini with YouTube URL directly:", downloadError);
    }

    // Step 3: Try to download video (optional)
    console.log("Step 3: Trying to download video...");
    try {
      const videoStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        filter: "videoandaudio",
        quality: "highest",
        agent,
        requestOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      });
      const videoBuffer = await streamToBuffer(videoStream);
      console.log(`Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const videoFileName = `media/links/${linkId}/video.mp4`;
      
      const storage = getRailwayStorage();
      const { error: videoUploadError } = await storage.upload(videoFileName, videoBuffer, {
        contentType: "video/mp4",
      });

      if (!videoUploadError) {
        const { signedUrl: videoSignedUrl } = await storage.createSignedUrl(videoFileName, 60 * 60 * 24 * 365);

        await supabase
          .from("links")
          .update({ video_url: videoSignedUrl })
          .eq("id", linkId);

        console.log(`Video uploaded to: ${videoSignedUrl}`);
      }
    } catch (videoDownloadError) {
      console.error("Video download failed:", videoDownloadError);
    }

    // Step 4: Transcribe with Gemini
    console.log("Step 4: Transcribing with Gemini...");
    
    let result;
    
    if (audioBuffer) {
      // Use downloaded audio
      const audioBase64 = audioBuffer.toString("base64");
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/webm",
            data: audioBase64,
          },
        },
        {
          text: `Transkribiere dieses Audio vollständig und präzise. 
        
Gib das Ergebnis als JSON-Array zurück mit folgendem Format:
[
  {"start": 0.0, "end": 5.5, "text": "Erster gesprochener Satz"},
  {"start": 5.5, "end": 12.0, "text": "Nächster Satz"},
  ...
]

WICHTIG:
- Transkribiere ALLE gesprochenen Worte exakt
- Zeitstempel in Sekunden (mit Dezimalstellen)
- Natürliche Satzgrenzen (5-15 Sekunden pro Segment)
- NUR das JSON-Array ausgeben, keine Erklärung`,
        },
      ]);
    } else {
      // Fallback: Use Gemini with YouTube URL (less accurate but works without download)
      console.log("Using Gemini with YouTube URL directly (fallback)...");
      result = await model.generateContent([
        {
          text: `Analysiere und transkribiere das YouTube-Video: https://www.youtube.com/watch?v=${videoId}

Erstelle eine vollständige Transkription mit Zeitstempeln im JSON-Format:
[
  {"start": 0.0, "end": 5.5, "text": "Erster gesprochener Satz"},
  {"start": 5.5, "end": 12.0, "text": "Nächster Satz"},
  ...
]

WICHTIG:
- Transkribiere ALLE gesprochenen Worte exakt wie im Video
- Zeitstempel in Sekunden
- NUR das JSON-Array ausgeben, keine Erklärung`,
        },
      ]);
    }

    const responseText = result.response.text();
    console.log("Gemini response received");

    // Parse transcript
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const segments = JSON.parse(jsonMatch[0]);
    console.log(`Parsed ${segments.length} transcript segments`);

    // Step 5: Delete old transcripts and save new ones
    await supabase
      .from("link_transcripts")
      .delete()
      .eq("link_id", linkId);

    const dbSegments = segments.map((s: any) => ({
      link_id: linkId,
      start_time: s.start,
      end_time: s.end,
      text: s.text,
    }));

    const { data: transcriptData, error: transcriptError } = await supabase
      .from("link_transcripts")
      .insert(dbSegments)
      .select();

    if (transcriptError) {
      console.error("Transcript save error:", transcriptError);
      throw new Error(`Failed to save transcript: ${transcriptError.message}`);
    }

    console.log(`Successfully processed video ${videoId}`);

    return NextResponse.json({
      success: true,
      audioUrl,
      transcript: transcriptData,
      segmentCount: segments.length,
    });

  } catch (error) {
    console.error("Video processing failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
