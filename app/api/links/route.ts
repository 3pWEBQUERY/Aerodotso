import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Innertube } from "youtubei.js";

// GET - List links for a workspace
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }

  return NextResponse.json({ links: data });
}

// Detect link type from URL
function detectLinkType(url: string): string {
  const urlLower = url.toLowerCase();
  
  // Video platforms
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "youtube";
  if (urlLower.includes("vimeo.com")) return "vimeo";
  if (urlLower.includes("twitch.tv")) return "twitch";
  if (urlLower.includes("dailymotion.com")) return "video";
  if (urlLower.includes("tiktok.com")) return "tiktok";
  
  // Social media
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
  if (urlLower.includes("instagram.com")) return "instagram";
  if (urlLower.includes("facebook.com") || urlLower.includes("fb.com")) return "facebook";
  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("reddit.com")) return "reddit";
  if (urlLower.includes("pinterest.com")) return "pinterest";
  
  // Music/Audio
  if (urlLower.includes("spotify.com")) return "spotify";
  if (urlLower.includes("soundcloud.com")) return "soundcloud";
  if (urlLower.includes("apple.com/music") || urlLower.includes("music.apple.com")) return "apple_music";
  
  // Documents
  if (urlLower.includes("docs.google.com")) return "google_doc";
  if (urlLower.includes("notion.so") || urlLower.includes("notion.site")) return "notion";
  if (urlLower.includes("figma.com")) return "figma";
  if (urlLower.includes("miro.com")) return "miro";
  
  // Code/Dev
  if (urlLower.includes("github.com")) return "github";
  if (urlLower.includes("gitlab.com")) return "gitlab";
  if (urlLower.includes("stackoverflow.com")) return "stackoverflow";
  
  // News/Articles
  if (urlLower.includes("medium.com")) return "article";
  if (urlLower.includes("substack.com")) return "article";
  
  // File extensions
  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url)) return "video";
  if (/\.(mp3|wav|ogg|m4a|flac)(\?|$)/i.test(url)) return "audio";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url)) return "image";
  if (/\.(pdf)(\?|$)/i.test(url)) return "pdf";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)(\?|$)/i.test(url)) return "document";
  
  return "website";
}

// POST - Create a new link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { workspaceId, url, title, description, thumbnail_url } = await req.json();

  if (!workspaceId || !url) {
    return NextResponse.json({ error: "Workspace ID and URL required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Detect link type automatically
  const linkType = detectLinkType(url);
  console.log(`Detected link type: ${linkType} for URL: ${url}`);

  // Try to extract metadata from URL (simple version)
  let linkTitle = title || url;
  try {
    const urlObj = new URL(url);
    linkTitle = title || urlObj.hostname;
  } catch {
    // Invalid URL, use as-is
  }

  const { data, error } = await supabase
    .from("links")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      url,
      title: linkTitle,
      description: description || null,
      thumbnail_url: thumbnail_url || null,
      link_type: linkType,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }

  // Auto-process YouTube videos in the background (download, store, transcribe with Gemini)
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  if (isYouTube && data?.id) {
    // Fire and forget - don't wait for processing
    processVideoInBackground(data.id).catch(err => {
      console.error("Background video processing failed:", err);
    });
  }

  return NextResponse.json({ link: data });
}

// Background video processing - calls the process-video endpoint
async function processVideoInBackground(linkId: string) {
  console.log(`Starting background video processing for link ${linkId}...`);
  
  try {
    // Get the base URL from environment or default to localhost
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    // Call the process-video endpoint internally
    const response = await fetch(`${baseUrl}/api/links/${linkId}/process-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`Video processing completed: ${result.segmentCount} segments`);
    } else {
      const error = await response.json();
      console.error("Video processing failed:", error);
      
      // Fallback to youtubei.js transcription
      await transcribeVideoFallback(linkId);
    }
  } catch (error) {
    console.error("Background processing error:", error);
    // Fallback to youtubei.js transcription
    await transcribeVideoFallback(linkId);
  }
}

// Fallback transcription using youtubei.js (when video download fails)
async function transcribeVideoFallback(linkId: string) {
  const supabase = createSupabaseServerClient();
  
  // Get link to extract video ID
  const { data: link } = await supabase
    .from("links")
    .select("url")
    .eq("id", linkId)
    .single();
    
  if (!link?.url) return;
  
  const videoIdMatch = link.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (!videoIdMatch) return;
  const videoId = videoIdMatch[1];

  let segments: { start: number; end: number; text: string }[] = [];
  
  try {
    console.log(`Fallback: Fetching transcript for ${videoId} with youtubei.js...`);
    
    const youtube = await Innertube.create({
      lang: "de",
      location: "DE",
      retrieve_player: false,
    });
    
    const info = await youtube.getInfo(videoId);
    const transcriptInfo = await info.getTranscript();
    
    if (transcriptInfo?.transcript?.content?.body?.initial_segments) {
      const rawSegments = transcriptInfo.transcript.content.body.initial_segments;
      
      let currentSegment: { start: number; end: number; text: string } | null = null;
      
      for (const seg of rawSegments) {
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
          if (currentSegment) segments.push(currentSegment);
          currentSegment = { start: startTime, end: endTime, text: text.trim() };
        }
      }
      
      if (currentSegment) segments.push(currentSegment);
    }
  } catch (err) {
    console.error("Fallback transcription failed:", err);
  }

  if (segments.length > 0) {
    const dbSegments = segments.map((s) => ({
      link_id: linkId,
      start_time: s.start,
      end_time: s.end,
      text: s.text,
    }));

    await supabase.from("link_transcripts").insert(dbSegments);
    console.log(`Fallback transcribed ${segments.length} segments for link ${linkId}`);
  }
}

// DELETE - Delete a link
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await req.json();
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId);

  if (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
