import { NextRequest, NextResponse } from "next/server";

// Extract YouTube video ID from various URL formats
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

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Special handling for YouTube URLs
    const youtubeVideoId = extractYouTubeVideoId(validUrl.toString());
    if (youtubeVideoId) {
      // Try to get title from noembed API
      let title = "YouTube Video";
      try {
        const noembedRes = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeVideoId}`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (noembedRes.ok) {
          const data = await noembedRes.json();
          if (data.title) title = data.title;
        }
      } catch {
        // Ignore errors, use default title
      }
      
      return NextResponse.json({
        title,
        description: "",
        image: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
        url: validUrl.toString(),
        domain: "youtube.com",
      });
    }

    // Special handling for Vimeo
    const vimeoMatch = validUrl.pathname.match(/\/(\d+)/);
    if (validUrl.hostname.includes("vimeo.com") && vimeoMatch) {
      return NextResponse.json({
        title: "Vimeo Video",
        description: "",
        image: null, // Vimeo requires API call for thumbnail
        url: validUrl.toString(),
        domain: "vimeo.com",
      });
    }

    // Fetch the page
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MizaBot/1.0; +https://miza.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({ 
        title: validUrl.hostname,
        description: "",
        image: null,
        url: validUrl.toString(),
      });
    }

    const html = await response.text();

    // Extract metadata using regex (simple parser)
    const getMetaContent = (name: string): string | null => {
      // Try Open Graph
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, "i"));
      if (ogMatch) return ogMatch[1];

      // Try Twitter
      const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${name}["'][^>]*content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${name}["']`, "i"));
      if (twitterMatch) return twitterMatch[1];

      // Try standard meta
      const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i"));
      if (metaMatch) return metaMatch[1];

      return null;
    };

    // Extract title
    let title = getMetaContent("title");
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : validUrl.hostname;
    }

    // Extract description
    const description = getMetaContent("description") || "";

    // Extract image with multiple fallbacks
    let image = getMetaContent("image");
    
    // Also try og:image:secure_url and itemprop="image"
    if (!image) {
      const secureMatch = html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i);
      if (secureMatch) image = secureMatch[1];
    }
    if (!image) {
      const itempropMatch = html.match(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*itemprop=["']image["']/i);
      if (itempropMatch) image = itempropMatch[1];
    }
    
    // Fallback 1: Try to find apple-touch-icon (usually high quality)
    if (!image) {
      const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);
      if (appleTouchMatch) image = appleTouchMatch[1];
    }
    
    // Fallback 2: Try to find any large icon
    if (!image) {
      const iconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*sizes=["'](\d+)x\d+["'][^>]*href=["']([^"']+)["']/i);
      if (iconMatch && parseInt(iconMatch[1]) >= 32) {
        image = iconMatch[2];
      }
    }
    
    // Fallback 3: Try standard favicon
    if (!image) {
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
      if (faviconMatch) image = faviconMatch[1];
    }
    
    // Fallback 4: Use Google's favicon service (most reliable)
    if (!image) {
      image = `https://www.google.com/s2/favicons?domain=${validUrl.hostname}&sz=128`;
    } else if (!image.startsWith("http")) {
      // Make relative URL absolute
      image = new URL(image, validUrl.origin).toString();
    }

    // Clean up HTML entities
    const decodeHtml = (text: string): string => {
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    };

    return NextResponse.json({
      title: decodeHtml(title || validUrl.hostname),
      description: decodeHtml(description).slice(0, 200),
      image,
      url: validUrl.toString(),
      domain: validUrl.hostname,
    });

  } catch (error) {
    console.error("Failed to fetch URL preview:", error);
    return NextResponse.json({ 
      error: "Failed to fetch preview",
      title: "",
      description: "",
      image: null,
    }, { status: 200 }); // Return 200 with empty data instead of error
  }
}
