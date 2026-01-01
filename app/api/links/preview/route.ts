import { NextRequest, NextResponse } from "next/server";
import { detectPlatform } from "@/lib/social/platform-detector";

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

// Try to fetch oEmbed data for better previews
async function fetchOEmbed(url: string, platform: string): Promise<{ title?: string; thumbnail?: string; author?: string; html?: string } | null> {
  const oembedEndpoints: Record<string, string> = {
    twitter: `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`,
    youtube: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    instagram: `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`,
    tiktok: `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    spotify: `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
    vimeo: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    reddit: `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`,
    soundcloud: `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  };

  const endpoint = oembedEndpoints[platform];
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MizaBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      title: data.title || data.author_name,
      thumbnail: data.thumbnail_url,
      author: data.author_name,
      html: data.html,
    };
  } catch {
    return null;
  }
}

// Try noembed.com as fallback (supports many platforms)
async function fetchNoembed(url: string): Promise<{ title?: string; thumbnail?: string; author?: string } | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.error) return null;
    
    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      author: data.author_name,
    };
  } catch {
    return null;
  }
}

// Use Microlink API for JavaScript-heavy sites (Twitter, Instagram, etc.)
async function fetchMicrolink(url: string): Promise<{ title?: string; description?: string; image?: string; logo?: string } | null> {
  try {
    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'success') return null;
    
    return {
      title: data.data?.title,
      description: data.data?.description,
      image: data.data?.image?.url,
      logo: data.data?.logo?.url,
    };
  } catch {
    return null;
  }
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

    // Detect social media platform
    const detected = detectPlatform(validUrl.toString());
    
    // Special handling for YouTube URLs
    const youtubeVideoId = extractYouTubeVideoId(validUrl.toString());
    if (youtubeVideoId) {
      // Try to get title from oEmbed API
      const oembed = await fetchOEmbed(validUrl.toString(), 'youtube');
      
      return NextResponse.json({
        title: oembed?.title || "YouTube Video",
        description: oembed?.author ? `by ${oembed.author}` : "",
        image: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
        url: validUrl.toString(),
        domain: "youtube.com",
        platform: "youtube",
      });
    }

    // Special handling for Vimeo
    if (validUrl.hostname.includes("vimeo.com")) {
      const oembed = await fetchOEmbed(validUrl.toString(), 'vimeo');
      return NextResponse.json({
        title: oembed?.title || "Vimeo Video",
        description: oembed?.author ? `by ${oembed.author}` : "",
        image: oembed?.thumbnail || null,
        url: validUrl.toString(),
        domain: "vimeo.com",
        platform: "vimeo",
      });
    }

    // Special handling for Twitter/X
    if (detected?.platform === 'twitter') {
      // Extract tweet ID and username from URL
      const tweetMatch = validUrl.toString().match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/i);
      
      if (tweetMatch) {
        const username = tweetMatch[1];
        const tweetId = tweetMatch[2];
        
        try {
          // Use FixTweet API which returns JSON with tweet data including media
          const apiUrl = `https://api.fxtwitter.com/${username}/status/${tweetId}`;
          const apiResponse = await fetch(apiUrl, {
            headers: {
              "Accept": "application/json",
            },
            signal: AbortSignal.timeout(8000),
          });
          
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            const tweet = data.tweet;
            
            if (tweet) {
              // Get the best image: media image > external media > author avatar
              let image = null;
              
              // Check for media (photos/videos)
              if (tweet.media?.photos && tweet.media.photos.length > 0) {
                image = tweet.media.photos[0].url;
              } else if (tweet.media?.videos && tweet.media.videos.length > 0) {
                image = tweet.media.videos[0].thumbnail_url;
              } else if (tweet.media?.external) {
                image = tweet.media.external.thumbnail_url;
              } else if (tweet.author?.avatar_url) {
                image = tweet.author.avatar_url;
              }
              
              return NextResponse.json({
                title: tweet.author?.name ? `${tweet.author.name} on X` : "X Post",
                description: tweet.text?.slice(0, 200) || "",
                image: image,
                url: validUrl.toString(),
                domain: "x.com",
                platform: "twitter",
              });
            }
          }
        } catch (fxError) {
          console.error("fxtwitter API failed:", fxError);
        }
      }
      
      // Fallback: use X logo
      const xLogoUrl = "https://abs.twimg.com/icons/apple-touch-icon-192x192.png";
      const twitterOembed = await fetchOEmbed(validUrl.toString(), 'twitter');
      
      return NextResponse.json({
        title: twitterOembed?.title || "X Post",
        description: twitterOembed?.author ? `@${twitterOembed.author}` : "",
        image: xLogoUrl,
        url: validUrl.toString(),
        domain: "x.com",
        platform: "twitter",
      });
    }
    
    // Special handling for Instagram - Try noembed
    if (detected?.platform === 'instagram') {
      const noembed = await fetchNoembed(validUrl.toString());
      if (noembed?.thumbnail) {
        // Decode HTML entities in image URL (noembed returns &amp; instead of &)
        const imageUrl = noembed.thumbnail
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        return NextResponse.json({
          title: noembed.title || "Instagram Post",
          description: noembed.author ? `@${noembed.author}` : "",
          image: imageUrl,
          url: validUrl.toString(),
          domain: "instagram.com",
          platform: "instagram",
        });
      }
    }
    
    // Special handling for Reddit - Try noembed
    if (detected?.platform === 'reddit') {
      const noembed = await fetchNoembed(validUrl.toString());
      if (noembed) {
        return NextResponse.json({
          title: noembed.title || "Reddit Post",
          description: "",
          image: noembed.thumbnail,
          url: validUrl.toString(),
          domain: "reddit.com",
          platform: "reddit",
        });
      }
    }

    // Special handling for TikTok
    if (detected?.platform === 'tiktok') {
      const oembed = await fetchOEmbed(validUrl.toString(), 'tiktok');
      if (oembed) {
        return NextResponse.json({
          title: oembed.title || "TikTok Video",
          description: oembed.author ? `@${oembed.author}` : "",
          image: oembed.thumbnail,
          url: validUrl.toString(),
          domain: "tiktok.com",
          platform: "tiktok",
        });
      }
    }

    // Special handling for Spotify
    if (detected?.platform === 'spotify') {
      const oembed = await fetchOEmbed(validUrl.toString(), 'spotify');
      if (oembed) {
        return NextResponse.json({
          title: oembed.title || "Spotify",
          description: "",
          image: oembed.thumbnail,
          url: validUrl.toString(),
          domain: "spotify.com",
          platform: "spotify",
        });
      }
    }

    // Special handling for SoundCloud
    if (detected?.platform === 'soundcloud') {
      const oembed = await fetchOEmbed(validUrl.toString(), 'soundcloud');
      if (oembed) {
        return NextResponse.json({
          title: oembed.title || "SoundCloud",
          description: oembed.author ? `by ${oembed.author}` : "",
          image: oembed.thumbnail,
          url: validUrl.toString(),
          domain: "soundcloud.com",
          platform: "soundcloud",
        });
      }
    }

    // Fetch the page with browser-like headers for better scraping
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout for slower sites
      redirect: "follow",
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
      image: image ? decodeHtml(image) : null,
      url: validUrl.toString(),
      domain: validUrl.hostname,
      platform: detected?.platform || null,
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
