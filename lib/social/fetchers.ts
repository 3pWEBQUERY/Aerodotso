// Social Media Data Fetchers
// Multi-strategy fetching: oEmbed, Platform APIs, OpenGraph scraping

import {
  SupportedPlatform,
  SocialPost,
  TwitterPost,
  YouTubeVideo,
  InstagramPost,
  RedditPost,
  GitHubRepo,
  SpotifyContent,
  TikTokVideo,
  GenericSocialPost,
  OEmbedResponse,
  FetchError,
  CACHE_TTL,
} from './types';
import { 
  detectPlatform, 
  buildOEmbedUrl, 
  getSpotifyContentType,
  getGitHubContentType,
  isYouTubeShort,
} from './platform-detector';

// ============================================================================
// FETCH ERROR HANDLING
// ============================================================================

export function createFetchError(
  type: FetchError['type'],
  platform: SupportedPlatform,
  message?: string,
  statusCode?: number
): FetchError {
  const defaultMessages: Record<FetchError['type'], string> = {
    not_found: 'This post has been deleted or doesn\'t exist.',
    private: 'This is a private post and cannot be displayed.',
    rate_limited: 'Too many requests. Please try again later.',
    network: 'Network error. Check your connection.',
    unsupported: 'This content type is not yet supported.',
    auth_required: 'Authentication required to access this content.',
    unknown: 'Something went wrong loading this post.',
  };

  return {
    type,
    platform,
    message: message || defaultMessages[type],
    statusCode,
  };
}

// ============================================================================
// OEMBED FETCHER
// ============================================================================

export async function fetchOEmbed(
  url: string,
  platform: SupportedPlatform,
  options?: { maxWidth?: number; maxHeight?: number }
): Promise<OEmbedResponse | null> {
  const oembedUrl = buildOEmbedUrl(platform, url, options);
  if (!oembedUrl) return null;

  try {
    const response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`oEmbed fetch failed for ${platform}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`oEmbed fetch error for ${platform}:`, error);
    return null;
  }
}

// ============================================================================
// OPENGRAPH SCRAPER (Server-side)
// ============================================================================

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  siteName?: string;
  type?: string;
  url?: string;
  author?: string;
  publishedTime?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
}

export async function scrapeOpenGraph(url: string): Promise<OpenGraphData> {
  try {
    const response = await fetch('/api/social/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenGraph scrape error:', error);
    return {};
  }
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

export async function fetchSocialPost(url: string): Promise<SocialPost> {
  const detected = detectPlatform(url);
  
  if (!detected) {
    // Fallback to OpenGraph for unknown URLs
    return fetchGenericPost(url);
  }

  const { platform, postId, params } = detected;

  // Try platform-specific fetcher first
  try {
    switch (platform) {
      case 'twitter':
        return await fetchTwitterPost(url, postId, params);
      case 'youtube':
        return await fetchYouTubeVideo(url, postId, params);
      case 'instagram':
        return await fetchInstagramPost(url, postId, params);
      case 'reddit':
        return await fetchRedditPost(url, postId, params);
      case 'github':
        return await fetchGitHubRepo(url, postId, params);
      case 'spotify':
        return await fetchSpotifyContent(url, postId, params);
      case 'tiktok':
        return await fetchTikTokVideo(url, postId, params);
      default:
        return await fetchGenericPost(url, platform);
    }
  } catch (error) {
    console.error(`Failed to fetch ${platform} post:`, error);
    // Fallback to OpenGraph
    return fetchGenericPost(url, platform);
  }
}

// ============================================================================
// TWITTER/X FETCHER
// ============================================================================

async function fetchTwitterPost(
  url: string,
  postId: string,
  params: Record<string, string>
): Promise<TwitterPost> {
  // Try oEmbed first
  const oembed = await fetchOEmbed(url, 'twitter');
  
  const now = new Date();
  const ttl = CACHE_TTL.twitter;

  // Parse author from oEmbed or URL
  const authorName = oembed?.author_name || params.username || 'Unknown';
  const authorHandle = params.username || authorName;

  return {
    id: postId,
    platform: 'twitter',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    author: {
      name: authorName,
      handle: authorHandle,
      profileUrl: `https://twitter.com/${authorHandle}`,
      verified: false,
    },
    content: {
      text: oembed?.title || '',
    },
    metrics: {
      likes: 0,
      comments: 0,
      retweets: 0,
      views: 0,
    },
    createdAt: now,
  };
}

// ============================================================================
// YOUTUBE FETCHER
// ============================================================================

async function fetchYouTubeVideo(
  url: string,
  videoId: string,
  params: Record<string, string>
): Promise<YouTubeVideo> {
  // Try oEmbed first
  const oembed = await fetchOEmbed(url, 'youtube', { maxWidth: 560 });
  
  const now = new Date();
  const ttl = CACHE_TTL.youtube;
  const isShort = isYouTubeShort(url);

  return {
    id: videoId,
    platform: 'youtube',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    videoId,
    author: {
      name: oembed?.author_name || 'Unknown',
      handle: oembed?.author_name || 'unknown',
      profileUrl: oembed?.author_url || `https://www.youtube.com`,
    },
    content: {
      title: oembed?.title || 'YouTube Video',
      description: '',
    },
    thumbnail: {
      default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
      medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    },
    metrics: {
      likes: 0,
      comments: 0,
      views: 0,
    },
    duration: 'PT0S',
    publishedAt: now,
    isShort,
    isLive: false,
  };
}

// ============================================================================
// INSTAGRAM FETCHER
// ============================================================================

async function fetchInstagramPost(
  url: string,
  postId: string,
  params: Record<string, string>
): Promise<InstagramPost> {
  const now = new Date();
  const ttl = CACHE_TTL.instagram;

  const isReel = url.includes('/reel/') || url.includes('/reels/');
  
  let media: InstagramPost['media'] = [];
  let caption = '';
  let authorName = params.username || 'Instagram User';
  let authorHandle = params.username || 'instagramuser';
  
  // Scrape Instagram page directly for OpenGraph data
  let authorAvatar = '';
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract og:image (post image)
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      
      if (ogImageMatch) {
        const imageUrl = ogImageMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        media = [{
          type: isReel ? 'video' : 'image',
          url: imageUrl,
          thumbnailUrl: imageUrl,
          width: 640,
          height: 640,
        }];
      }
      
      // Extract og:title for author name and caption
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      
      if (ogTitleMatch) {
        const title = ogTitleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        // Format: "Author on Instagram: caption" or just caption
        const match = title.match(/^(.+?)\s+on Instagram[:\s]+["']?(.*)["']?$/i);
        if (match) {
          authorName = match[1];
          caption = match[2];
        } else {
          caption = title;
        }
      }
      
      // Extract og:description for username (format: "X likes, Y comments - USERNAME on DATE:")
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      
      if (ogDescMatch) {
        const desc = ogDescMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&quot;/g, '"');
        
        // Extract username from description (format: "X likes, Y comments - USERNAME on DATE:")
        const usernameMatch = desc.match(/comments?\s*-\s*([a-zA-Z0-9_.]+)\s+on\s+/i);
        if (usernameMatch) {
          authorHandle = usernameMatch[1];
        }
      }
      
      // Try to extract profile picture from JSON-LD or script data
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.author?.image) {
            authorAvatar = jsonData.author.image;
          }
          if (jsonData.author?.name) {
            authorName = jsonData.author.name;
          }
        } catch {
          // JSON parse failed, continue
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch Instagram page:', e);
  }
  
  return {
    id: postId,
    platform: 'instagram',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    author: {
      name: authorName,
      handle: authorHandle,
      avatar: authorAvatar || undefined,
      profileUrl: `https://instagram.com/${authorHandle}`,
    },
    content: {
      caption,
    },
    media,
    metrics: {
      likes: 0,
      comments: 0,
    },
    postType: isReel ? 'reel' : 'image',
    createdAt: now,
  };
}

// ============================================================================
// REDDIT FETCHER
// ============================================================================

// Helper to extract best quality media from Reddit post
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRedditMedia(post: any): Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }> {
  const media: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }> = [];
  
  // Check for preview images (higher quality than thumbnail)
  if (post.preview?.images?.[0]?.source?.url) {
    const imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
    media.push({ type: 'image', url: imageUrl });
    return media;
  }
  
  // Check for gallery images
  if (post.is_gallery && post.media_metadata) {
    for (const key of Object.keys(post.media_metadata)) {
      const item = post.media_metadata[key];
      if (item.s?.u) {
        media.push({ type: 'image', url: item.s.u.replace(/&amp;/g, '&') });
      }
    }
    if (media.length > 0) return media;
  }
  
  // Check for video
  if (post.is_video && post.media?.reddit_video?.fallback_url) {
    media.push({ 
      type: 'video', 
      url: post.media.reddit_video.fallback_url,
      thumbnailUrl: post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : undefined,
    });
    return media;
  }
  
  // Check for external media (imgur, etc)
  if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
    media.push({ type: 'image', url: post.url });
    return media;
  }
  
  // Fallback to thumbnail
  if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw') {
    media.push({ type: 'image', url: post.thumbnail });
  }
  
  return media;
}

async function fetchRedditPost(
  url: string,
  postId: string,
  params: Record<string, string>
): Promise<RedditPost> {
  const now = new Date();
  const ttl = CACHE_TTL.reddit;
  
  let title = 'Reddit Post';
  let selftext = '';
  let subredditName = params.subreddit || 'reddit';
  let authorName = 'user';
  let imageUrl = '';
  
  // Extract subreddit from URL
  const subredditMatch = url.match(/reddit\.com\/r\/([^\/]+)/i);
  if (subredditMatch) {
    subredditName = subredditMatch[1];
  }
  
  // Check if this is a comment URL
  const isComment = /\/comment\/\w+/i.test(url) || /\/comments\/\w+\/[^\/]+\/\w+/i.test(url);
  
  // Use Reddit's oEmbed API (actually works!)
  try {
    const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'MizaApp/1.0' },
    });
    
    if (response.ok) {
      const oembed = await response.json();
      if (oembed.title) {
        // For comments, prepend "Comment on:" to distinguish from posts
        title = isComment ? `Comment on: ${oembed.title}` : oembed.title;
      }
      if (oembed.author_name) {
        authorName = oembed.author_name;
      }
      // Extract subreddit from HTML if available
      if (oembed.html) {
        const subMatch = oembed.html.match(/\/r\/([^\/'"<>]+)/);
        if (subMatch) {
          subredditName = subMatch[1];
        }
      }
    }
  } catch (e) {
    console.error('Reddit oEmbed fetch failed:', e);
  }
  
  // Build media array
  const media: Array<{ type: 'image' | 'video'; url: string }> = [];
  if (imageUrl && !imageUrl.includes('reddit-logo') && !imageUrl.includes('default')) {
    media.push({ type: 'image', url: imageUrl });
  }
  
  return {
    id: postId,
    platform: 'reddit',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    author: {
      name: authorName,
      handle: authorName,
      profileUrl: `https://reddit.com/u/${authorName}`,
    },
    subreddit: {
      name: subredditName,
      displayName: `r/${subredditName}`,
    },
    content: {
      title,
      selftext,
    },
    media,
    metrics: {
      upvotes: 0,
      downvotes: 0,
      comments: 0,
    },
    postType: imageUrl ? 'image' : selftext ? 'text' : 'link',
    isNSFW: false,
    isSpoiler: false,
    createdAt: now,
    permalink: url,
  };
}


// ============================================================================
// GITHUB FETCHER
// ============================================================================

async function fetchGitHubRepo(
  url: string,
  repoPath: string,
  params: Record<string, string>
): Promise<GitHubRepo> {
  const contentType = getGitHubContentType(url);
  
  if (contentType === 'repo' && params.owner && params.repo) {
    try {
      const apiUrl = `https://api.github.com/repos/${params.owner}/${params.repo}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MizaApp/1.0',
        },
      });

      if (response.ok) {
        const repo = await response.json();
        const now = new Date();
        const ttl = CACHE_TTL.github;

        return {
          id: repo.id.toString(),
          platform: 'github',
          url,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + ttl * 1000),
          contentType: 'repo',
          owner: {
            name: repo.owner.login,
            handle: repo.owner.login,
            avatar: repo.owner.avatar_url,
            profileUrl: repo.owner.html_url,
          },
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          metrics: {
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            watchers: repo.watchers_count || 0,
            issues: repo.open_issues_count || 0,
          },
          topics: repo.topics || [],
          license: repo.license?.spdx_id,
          isPrivate: repo.private,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          defaultBranch: repo.default_branch,
        };
      }
    } catch (error) {
      console.warn('GitHub API fetch failed:', error);
    }
  }

  // Fallback
  const now = new Date();
  const ttl = CACHE_TTL.github;
  
  return {
    id: repoPath,
    platform: 'github',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    contentType: contentType || 'repo',
    owner: {
      name: params.owner || 'Unknown',
      handle: params.owner || 'unknown',
      profileUrl: `https://github.com/${params.owner}`,
    },
    name: params.repo || 'Repository',
    fullName: `${params.owner}/${params.repo}`,
    metrics: {
      stars: 0,
      forks: 0,
      watchers: 0,
    },
    isPrivate: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// SPOTIFY FETCHER
// ============================================================================

async function fetchSpotifyContent(
  url: string,
  contentId: string,
  params: Record<string, string>
): Promise<SpotifyContent> {
  // Try oEmbed
  const oembed = await fetchOEmbed(url, 'spotify');
  
  const now = new Date();
  const ttl = CACHE_TTL.spotify;
  const contentType = getSpotifyContentType(url) || 'track';

  return {
    id: contentId,
    platform: 'spotify',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    contentType,
    name: oembed?.title || 'Spotify Content',
    artists: [],
    coverImage: oembed?.thumbnail_url || '',
    duration: 0,
    explicit: false,
  };
}

// ============================================================================
// TIKTOK FETCHER
// ============================================================================

async function fetchTikTokVideo(
  url: string,
  videoId: string,
  params: Record<string, string>
): Promise<TikTokVideo> {
  // Try oEmbed
  const oembed = await fetchOEmbed(url, 'tiktok');
  
  const now = new Date();
  const ttl = CACHE_TTL.tiktok;

  return {
    id: videoId,
    platform: 'tiktok',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    author: {
      name: oembed?.author_name || params.username || 'TikTok User',
      handle: params.username || 'user',
      profileUrl: oembed?.author_url || `https://tiktok.com/@${params.username}`,
    },
    content: {
      description: oembed?.title || '',
    },
    video: {
      type: 'video',
      url: '',
      coverImage: oembed?.thumbnail_url || '',
      playCount: 0,
    },
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    },
    createdAt: now,
  };
}

// ============================================================================
// GENERIC/FALLBACK FETCHER
// ============================================================================

async function fetchGenericPost(
  url: string,
  platform: SupportedPlatform = 'unknown'
): Promise<GenericSocialPost> {
  const ogData = await scrapeOpenGraph(url);
  
  const now = new Date();
  const ttl = CACHE_TTL[platform] || CACHE_TTL.default;

  return {
    id: url,
    platform: 'unknown',
    url,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
    openGraph: {
      title: ogData.title,
      description: ogData.description,
      image: ogData.image,
      imageWidth: ogData.imageWidth,
      imageHeight: ogData.imageHeight,
      siteName: ogData.siteName,
      type: ogData.type,
      author: ogData.author,
      publishedTime: ogData.publishedTime,
    },
  };
}

// ============================================================================
// BATCH FETCHER
// ============================================================================

export async function fetchSocialPostsBatch(
  urls: string[]
): Promise<Array<{ url: string; success: boolean; data?: SocialPost; error?: FetchError }>> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const post = await fetchSocialPost(url);
        return { url, success: true, data: post };
      } catch (error) {
        const detected = detectPlatform(url);
        return {
          url,
          success: false,
          error: createFetchError(
            'unknown',
            detected?.platform || 'unknown',
            error instanceof Error ? error.message : 'Unknown error'
          ),
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: urls[index],
      success: false,
      error: createFetchError('unknown', 'unknown', 'Fetch failed'),
    };
  });
}
