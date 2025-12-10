import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Innertube } from "youtubei.js";

// ElevenLabs API Key for Speech-to-Text and Text-to-Speech
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_a2aff0d47e5c5c3340831a24a1cd404779f1a4e896a34ffa";

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

// Method 1: Fetch transcript using youtubei.js (most reliable)
async function fetchTranscriptWithYoutubei(videoId: string): Promise<{ start: number; end: number; text: string }[]> {
  console.log(`Fetching transcript with youtubei.js for: ${videoId}`);
  
  try {
    const youtube = await Innertube.create({
      lang: "de",
      location: "DE",
      retrieve_player: false,
    });
    
    const info = await youtube.getInfo(videoId);
    const transcriptInfo = await info.getTranscript();
    
    if (!transcriptInfo?.transcript?.content?.body?.initial_segments) {
      console.log("No transcript found with youtubei.js");
      return [];
    }
    
    const segments = transcriptInfo.transcript.content.body.initial_segments;
    console.log(`Found ${segments.length} transcript segments`);
    
    const result: { start: number; end: number; text: string }[] = [];
    let currentSegment: { start: number; end: number; text: string } | null = null;
    
    for (const seg of segments) {
      if (seg.type !== "TranscriptSegment") continue;
      
      const startMs = parseInt(seg.start_ms || "0");
      const endMs = parseInt(seg.end_ms || "0");
      const text = seg.snippet?.text || "";
      
      if (!text.trim()) continue;
      
      const startTime = startMs / 1000;
      const endTime = endMs / 1000;
      
      if (currentSegment && startTime - currentSegment.end < 1.0 && currentSegment.text.length < 200) {
        currentSegment.text += " " + text.trim();
        currentSegment.end = endTime;
      } else {
        if (currentSegment) {
          result.push(currentSegment);
        }
        currentSegment = { start: startTime, end: endTime, text: text.trim() };
      }
    }
    
    if (currentSegment) {
      result.push(currentSegment);
    }
    
    console.log(`Merged into ${result.length} segments`);
    return result;
    
  } catch (error) {
    console.error("youtubei.js failed:", error);
    return [];
  }
}

// Transcribe audio using ElevenLabs Speech-to-Text API
async function transcribeWithElevenLabs(audioUrl: string): Promise<{ start: number; end: number; text: string }[]> {
  console.log(`Transcribing with ElevenLabs...`);
  
  try {
    // ElevenLabs Speech-to-Text endpoint
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: "de", // German
        timestamps_granularity: "word",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      return [];
    }

    const data = await response.json();
    console.log("ElevenLabs response received");
    
    // Parse ElevenLabs response into segments
    if (data.words && Array.isArray(data.words)) {
      const segments: { start: number; end: number; text: string }[] = [];
      let currentSegment: { start: number; end: number; text: string } | null = null;
      
      for (const word of data.words) {
        if (!currentSegment) {
          currentSegment = {
            start: word.start,
            end: word.end,
            text: word.text
          };
        } else if (word.start - currentSegment.end > 1.0 || currentSegment.text.length > 200) {
          // Start new segment on pause or length limit
          segments.push(currentSegment);
          currentSegment = {
            start: word.start,
            end: word.end,
            text: word.text
          };
        } else {
          currentSegment.text += " " + word.text;
          currentSegment.end = word.end;
        }
      }
      
      if (currentSegment) {
        segments.push(currentSegment);
      }
      
      console.log(`Parsed ${segments.length} segments from ElevenLabs`);
      return segments;
    }
    
    // Fallback: use full text with estimated timestamps
    if (data.text) {
      return [{
        start: 0,
        end: 60,
        text: data.text
      }];
    }
    
    return [];
    
  } catch (error) {
    console.error("ElevenLabs transcription failed:", error);
    return [];
  }
}


// Fetch YouTube captions using multiple methods
async function fetchYouTubeCaptions(videoId: string): Promise<{ start: number; end: number; text: string }[]> {
  console.log(`Fetching captions for video: ${videoId}`);
  
  try {
    // Method 1: Use innertube API (most reliable)
    console.log("Trying innertube API...");
    const innertubeResponse = await fetch("https://www.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20231219.04.00",
          },
        },
        params: Buffer.from(`\n\x0b${videoId}`).toString("base64"),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (innertubeResponse.ok) {
      const data = await innertubeResponse.json();
      const transcriptRenderer = data?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer;
      const cues = transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments;
      
      if (cues && cues.length > 0) {
        console.log(`Found ${cues.length} segments via innertube`);
        const segments: { start: number; end: number; text: string }[] = [];
        
        for (const cue of cues) {
          const segment = cue.transcriptSegmentRenderer;
          if (segment) {
            const startMs = parseInt(segment.startMs || "0");
            const endMs = parseInt(segment.endMs || "0");
            const text = segment.snippet?.runs?.map((r: any) => r.text).join("") || "";
            
            if (text.trim()) {
              segments.push({
                start: startMs / 1000,
                end: endMs / 1000,
                text: text.trim(),
              });
            }
          }
        }
        
        if (segments.length > 0) {
          console.log(`Parsed ${segments.length} segments from innertube`);
          return segments;
        }
      }
    }
    
    // Method 2: Scrape video page and extract captions from playerResponse
    console.log("Trying to extract captions from video page...");
    const pageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      { 
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15000) 
      }
    );
    
    if (!pageResponse.ok) {
      console.log("Failed to fetch video page");
      return [];
    }
    
    const html = await pageResponse.text();
    console.log(`Page HTML length: ${html.length}`);
    
    // Try to find captions in ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});\s*var/);
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (captionTracks && captionTracks.length > 0) {
          console.log(`Found ${captionTracks.length} caption tracks in playerResponse`);
          
          // Sort by preference
          const sortedTracks = captionTracks.sort((a: any, b: any) => {
            const aAuto = a.kind === "asr" ? 1 : 0;
            const bAuto = b.kind === "asr" ? 1 : 0;
            const aLang = a.languageCode?.startsWith("de") ? 0 : (a.languageCode?.startsWith("en") ? 1 : 2);
            const bLang = b.languageCode?.startsWith("de") ? 0 : (b.languageCode?.startsWith("en") ? 1 : 2);
            return (aAuto - bAuto) || (aLang - bLang);
          });
          
          for (const track of sortedTracks) {
            if (track.baseUrl) {
              console.log(`Trying track: ${track.languageCode} (${track.kind || 'manual'})`);
              
              // Fetch with srv3 format (more reliable)
              const formats = ["srv3", "json3", ""];
              for (const fmt of formats) {
                try {
                  const url = fmt ? `${track.baseUrl}&fmt=${fmt}` : track.baseUrl;
                  console.log(`Fetching: ${url.substring(0, 80)}...`);
                  
                  const trackResponse = await fetch(url, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                      "Accept": "*/*",
                      "Referer": "https://www.youtube.com/",
                    },
                    signal: AbortSignal.timeout(10000)
                  });
                  
                  if (trackResponse.ok) {
                    const trackText = await trackResponse.text();
                    console.log(`Response (fmt=${fmt}): length=${trackText.length}`);
                    
                    if (trackText.length > 10) {
                      // Try JSON parsing
                      if (trackText.startsWith("{")) {
                        const trackData = JSON.parse(trackText);
                        const parsed = parseYouTubeCaptions(trackData);
                        if (parsed.length > 0) {
                          console.log(`Successfully parsed ${parsed.length} captions (json)`);
                          return parsed;
                        }
                      }
                      
                      // Try XML parsing
                      if (trackText.includes("<text") || trackText.includes("<transcript>")) {
                        const parsed = parseXMLCaptions(trackText);
                        if (parsed.length > 0) {
                          console.log(`Successfully parsed ${parsed.length} captions (xml)`);
                          return parsed;
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log(`Format ${fmt} failed:`, e);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse playerResponse:", e);
      }
    }
    
    // Method 3: Try timedtext API directly
    console.log("Trying direct timedtext API...");
    const langs = ["de", "en"];
    for (const lang of langs) {
      try {
        const timedtextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
        const response = await fetch(timedtextUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const text = await response.text();
          if (text.length > 10) {
            const parsed = parseXMLCaptions(text);
            if (parsed.length > 0) {
              console.log(`Found ${parsed.length} captions via timedtext API (${lang})`);
              return parsed;
            }
          }
        }
      } catch {
        // Try next
      }
    }
    
    console.log("No captions found with any method");
    return [];
    
  } catch (error) {
    console.error("Failed to fetch YouTube captions:", error);
    return [];
  }
}

// Parse YouTube captions from JSON3 format
function parseYouTubeCaptions(data: any): { start: number; end: number; text: string }[] {
  if (!data?.events) return [];
  
  const segments: { start: number; end: number; text: string }[] = [];
  
  for (let i = 0; i < data.events.length; i++) {
    const event = data.events[i];
    if (event.segs && event.tStartMs !== undefined) {
      const text = event.segs.map((s: any) => s.utf8 || "").join("").trim();
      if (text && text !== "\n") {
        const startTime = event.tStartMs / 1000;
        const duration = event.dDurationMs ? event.dDurationMs / 1000 : 3;
        segments.push({
          start: startTime,
          end: startTime + duration,
          text: text.replace(/\n/g, " ").trim(),
        });
      }
    }
  }
  
  // Merge short segments for better readability
  const merged: { start: number; end: number; text: string }[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && seg.start - merged[merged.length - 1].end < 0.5) {
      merged[merged.length - 1].text += " " + seg.text;
      merged[merged.length - 1].end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  
  return merged;
}

// Parse YouTube captions from XML format
function parseXMLCaptions(xml: string): { start: number; end: number; text: string }[] {
  const segments: { start: number; end: number; text: string }[] = [];
  
  // Match <text start="X" dur="Y">content</text>
  const textRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
  let match;
  
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, " ")
      .trim();
    
    if (text) {
      segments.push({
        start,
        end: start + duration,
        text,
      });
    }
  }
  
  // Merge short segments
  const merged: { start: number; end: number; text: string }[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && seg.start - merged[merged.length - 1].end < 1.0 && merged[merged.length - 1].text.length < 200) {
      merged[merged.length - 1].text += " " + seg.text;
      merged[merged.length - 1].end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  
  return merged;
}

// POST - Generate transcript for a link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Check if transcript already exists
  const { data: existing } = await supabase
    .from("link_transcripts")
    .select("id")
    .eq("link_id", linkId)
    .limit(1);

  if (existing && existing.length > 0) {
    // Return existing transcript
    const { data } = await supabase
      .from("link_transcripts")
      .select("*")
      .eq("link_id", linkId)
      .order("start_time", { ascending: true });
    
    return NextResponse.json({ transcript: data || [] });
  }

  // Extract video ID
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Only YouTube videos are supported for transcription" }, { status: 400 });
  }

  // Strategy (in order of reliability):
  // 1. youtube-transcript package (most reliable for existing captions)
  // 2. Manual YouTube caption fetching (fallback)
  // Note: ElevenLabs Speech-to-Text is available for direct audio files
  
  let captions: { start: number; end: number; text: string }[] = [];
  let source = "unknown";

  // Try Method 1: youtubei.js (most reliable)
  captions = await fetchTranscriptWithYoutubei(videoId);
  if (captions.length > 0) {
    source = "youtubei.js";
  }

  // Try Method 2: Manual YouTube caption fetching
  if (captions.length === 0) {
    console.log("youtube-transcript failed, trying manual fetch...");
    captions = await fetchYouTubeCaptions(videoId);
    if (captions.length > 0) {
      source = "youtube_manual_fetch";
    }
  }

  if (captions.length === 0) {
    return NextResponse.json({ 
      transcript: [],
      message: "Dieses Video hat keine YouTube-Untertitel. Transkription nicht möglich."
    });
  }
  
  console.log(`Found ${captions.length} transcript segments for video ${videoId} (source: ${source})`);

  // Save transcript segments to database
  const segments = captions.map((caption) => ({
    link_id: linkId,
    start_time: caption.start,
    end_time: caption.end,
    text: caption.text,
  }));

  const { data, error } = await supabase
    .from("link_transcripts")
    .insert(segments)
    .select();

  if (error) {
    console.error("Error saving transcript:", error);
    return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 });
  }

  return NextResponse.json({ transcript: data });
}
