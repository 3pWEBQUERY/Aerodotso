// Social Media Platform Detection
// Robust URL pattern matching for all supported platforms

import { SupportedPlatform, PlatformDetectionResult } from './types';

// ============================================================================
// PLATFORM URL PATTERNS
// ============================================================================

export const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp[]> = {
  twitter: [
    /^https?:\/\/(www\.)?(twitter|x)\.com\/(?<username>\w+)\/status\/(?<postId>\d+)/i,
    /^https?:\/\/(www\.)?(twitter|x)\.com\/i\/web\/status\/(?<postId>\d+)/i,
    /^https?:\/\/(mobile\.)?(twitter|x)\.com\/(?<username>\w+)\/status\/(?<postId>\d+)/i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=(?<videoId>[\w-]+)/i,
    /^https?:\/\/youtu\.be\/(?<videoId>[\w-]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/(?<videoId>[\w-]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/(?<videoId>[\w-]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/v\/(?<videoId>[\w-]+)/i,
    /^https?:\/\/m\.youtube\.com\/watch\?v=(?<videoId>[\w-]+)/i,
  ],
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\/p\/(?<postId>[\w-]+)\/?(?:\?.*)?$/i,
    /^https?:\/\/(www\.)?instagram\.com\/reel\/(?<postId>[\w-]+)\/?(?:\?.*)?$/i,
    /^https?:\/\/(www\.)?instagram\.com\/reels\/(?<postId>[\w-]+)\/?(?:\?.*)?$/i,
    /^https?:\/\/(www\.)?instagram\.com\/tv\/(?<postId>[\w-]+)\/?(?:\?.*)?$/i,
    /^https?:\/\/(www\.)?instagram\.com\/stories\/(?<username>[\w.]+)\/(?<storyId>\d+)\/?(?:\?.*)?$/i,
  ],
  linkedin: [
    /^https?:\/\/(www\.)?linkedin\.com\/posts\/(?<slug>[\w-]+)/i,
    /^https?:\/\/(www\.)?linkedin\.com\/feed\/update\/urn:li:activity:(?<activityId>\d+)/i,
    /^https?:\/\/(www\.)?linkedin\.com\/feed\/update\/urn:li:share:(?<shareId>\d+)/i,
    /^https?:\/\/(www\.)?linkedin\.com\/pulse\/(?<articleSlug>[\w-]+)/i,
    /^https?:\/\/(www\.)?linkedin\.com\/embed\/feed\/update\/urn:li:share:(?<shareId>\d+)/i,
  ],
  tiktok: [
    /^https?:\/\/(www\.)?tiktok\.com\/@(?<username>[\w.]+)\/video\/(?<videoId>\d+)/i,
    /^https?:\/\/vm\.tiktok\.com\/(?<shortCode>\w+)/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/(?<shortCode>\w+)/i,
    /^https?:\/\/m\.tiktok\.com\/v\/(?<videoId>\d+)/i,
  ],
  threads: [
    /^https?:\/\/(www\.)?threads\.net\/@(?<username>[\w.]+)\/post\/(?<postId>[\w-]+)/i,
    /^https?:\/\/(www\.)?threads\.net\/t\/(?<postId>[\w-]+)/i,
  ],
  bluesky: [
    /^https?:\/\/bsky\.app\/profile\/(?<handle>[\w.-]+)\/post\/(?<postId>\w+)/i,
    /^https?:\/\/staging\.bsky\.app\/profile\/(?<handle>[\w.-]+)\/post\/(?<postId>\w+)/i,
  ],
  facebook: [
    /^https?:\/\/(www\.)?facebook\.com\/(?<username>[\w.]+)\/posts\/(?<postId>\d+)/i,
    /^https?:\/\/(www\.)?facebook\.com\/(?<username>[\w.]+)\/videos\/(?<videoId>\d+)/i,
    /^https?:\/\/(www\.)?facebook\.com\/watch\/\?v=(?<videoId>\d+)/i,
    /^https?:\/\/(www\.)?facebook\.com\/photo\.php\?fbid=(?<photoId>\d+)/i,
    /^https?:\/\/(www\.)?facebook\.com\/(?<pageId>\d+)\/posts\/(?<postId>\d+)/i,
    /^https?:\/\/fb\.watch\/(?<videoId>[\w-]+)/i,
    /^https?:\/\/(www\.)?facebook\.com\/reel\/(?<reelId>\d+)/i,
  ],
  reddit: [
    /^https?:\/\/(www\.)?(reddit\.com|old\.reddit\.com)\/r\/(?<subreddit>\w+)\/comments\/(?<postId>\w+)/i,
    /^https?:\/\/(www\.)?reddit\.com\/r\/(?<subreddit>\w+)\/s\/(?<shortId>\w+)/i,
    /^https?:\/\/redd\.it\/(?<postId>\w+)/i,
    /^https?:\/\/(www\.)?reddit\.com\/(?<postId>\w+)/i,
  ],
  pinterest: [
    /^https?:\/\/(www\.)?pinterest\.(com|de|co\.uk|ca|fr|it|es|at|ch)\/pin\/(?<pinId>\d+)/i,
    /^https?:\/\/pin\.it\/(?<shortId>\w+)/i,
  ],
  spotify: [
    /^https?:\/\/open\.spotify\.com\/track\/(?<trackId>\w+)/i,
    /^https?:\/\/open\.spotify\.com\/album\/(?<albumId>\w+)/i,
    /^https?:\/\/open\.spotify\.com\/playlist\/(?<playlistId>\w+)/i,
    /^https?:\/\/open\.spotify\.com\/episode\/(?<episodeId>\w+)/i,
    /^https?:\/\/open\.spotify\.com\/show\/(?<showId>\w+)/i,
    /^https?:\/\/open\.spotify\.com\/artist\/(?<artistId>\w+)/i,
    /^https?:\/\/spotify\.link\/(?<shortId>\w+)/i,
  ],
  github: [
    /^https?:\/\/(www\.)?github\.com\/(?<owner>[\w-]+)\/(?<repo>[\w.-]+)$/i,
    /^https?:\/\/(www\.)?github\.com\/(?<owner>[\w-]+)\/(?<repo>[\w.-]+)\/?$/i,
    /^https?:\/\/gist\.github\.com\/(?<owner>[\w-]+)\/(?<gistId>\w+)/i,
    /^https?:\/\/(www\.)?github\.com\/(?<owner>[\w-]+)\/(?<repo>[\w.-]+)\/(?<type>issues|pull|discussions)\/(?<number>\d+)/i,
  ],
  medium: [
    /^https?:\/\/(www\.)?medium\.com\/@(?<username>[\w-]+)\/(?<slug>[\w-]+)-(?<postId>\w+)/i,
    /^https?:\/\/(?<publication>[\w-]+)\.medium\.com\/(?<slug>[\w-]+)-(?<postId>\w+)/i,
    /^https?:\/\/(www\.)?medium\.com\/(?<publication>[\w-]+)\/(?<slug>[\w-]+)-(?<postId>\w+)/i,
  ],
  substack: [
    /^https?:\/\/(?<publication>[\w-]+)\.substack\.com\/p\/(?<slug>[\w-]+)/i,
    /^https?:\/\/(www\.)?substack\.com\/@(?<username>[\w-]+)\/p\/(?<slug>[\w-]+)/i,
  ],
  vimeo: [
    /^https?:\/\/(www\.)?vimeo\.com\/(?<videoId>\d+)/i,
    /^https?:\/\/(www\.)?vimeo\.com\/channels\/[\w-]+\/(?<videoId>\d+)/i,
    /^https?:\/\/(www\.)?vimeo\.com\/groups\/[\w-]+\/videos\/(?<videoId>\d+)/i,
    /^https?:\/\/player\.vimeo\.com\/video\/(?<videoId>\d+)/i,
  ],
  twitch: [
    /^https?:\/\/(www\.)?twitch\.tv\/(?<channel>\w+)\/clip\/(?<clipId>[\w-]+)/i,
    /^https?:\/\/clips\.twitch\.tv\/(?<clipId>[\w-]+)/i,
    /^https?:\/\/(www\.)?twitch\.tv\/videos\/(?<videoId>\d+)/i,
  ],
  soundcloud: [
    /^https?:\/\/(www\.)?soundcloud\.com\/(?<artist>[\w-]+)\/(?<track>[\w-]+)/i,
    /^https?:\/\/(www\.)?soundcloud\.com\/(?<artist>[\w-]+)\/sets\/(?<playlist>[\w-]+)/i,
    /^https?:\/\/on\.soundcloud\.com\/(?<shortId>\w+)/i,
  ],
  mastodon: [
    /^https?:\/\/(?<instance>[\w.-]+)\/@(?<username>\w+)\/(?<postId>\d+)/i,
    /^https?:\/\/(?<instance>[\w.-]+)\/users\/(?<username>\w+)\/statuses\/(?<postId>\d+)/i,
  ],
  unknown: [],
};

// Known Mastodon instances for better detection
const KNOWN_MASTODON_INSTANCES = [
  'mastodon.social',
  'mastodon.online',
  'mas.to',
  'fosstodon.org',
  'infosec.exchange',
  'hachyderm.io',
  'techhub.social',
  'mstdn.social',
  'universeodon.com',
  'mastodon.world',
  'c.im',
  'masto.ai',
];

// ============================================================================
// OEMBED ENDPOINTS
// ============================================================================

export const OEMBED_ENDPOINTS: Partial<Record<SupportedPlatform, string>> = {
  twitter: 'https://publish.twitter.com/oembed',
  youtube: 'https://www.youtube.com/oembed',
  instagram: 'https://graph.facebook.com/v18.0/instagram_oembed',
  vimeo: 'https://vimeo.com/api/oembed.json',
  spotify: 'https://open.spotify.com/oembed',
  soundcloud: 'https://soundcloud.com/oembed',
  reddit: 'https://www.reddit.com/oembed',
  tiktok: 'https://www.tiktok.com/oembed',
  facebook: 'https://www.facebook.com/plugins/post/oembed.json',
};

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect which social media platform a URL belongs to
 */
export function detectPlatform(url: string): PlatformDetectionResult | null {
  // Normalize URL
  const normalizedUrl = url.trim();
  
  if (!normalizedUrl || !isValidUrl(normalizedUrl)) {
    return null;
  }

  // Check each platform's patterns
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === 'unknown') continue;
    
    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match) {
        const groups = match.groups || {};
        const postId = extractPostId(platform as SupportedPlatform, groups);
        
        return {
          platform: platform as SupportedPlatform,
          postId,
          params: groups,
          supported: true,
        };
      }
    }
  }

  // Check if it might be a Mastodon instance
  const mastodonResult = detectMastodonInstance(normalizedUrl);
  if (mastodonResult) {
    return mastodonResult;
  }

  return null;
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a social media URL
 */
export function isSocialMediaUrl(url: string): boolean {
  return detectPlatform(url) !== null;
}

/**
 * Extract the post ID from matched groups
 */
function extractPostId(platform: SupportedPlatform, groups: Record<string, string>): string {
  switch (platform) {
    case 'twitter':
      return groups.postId || '';
    case 'youtube':
      return groups.videoId || '';
    case 'instagram':
      return groups.postId || groups.storyId || '';
    case 'linkedin':
      return groups.activityId || groups.shareId || groups.slug || groups.articleSlug || '';
    case 'tiktok':
      return groups.videoId || groups.shortCode || '';
    case 'threads':
      return groups.postId || '';
    case 'bluesky':
      return groups.postId || '';
    case 'facebook':
      return groups.postId || groups.videoId || groups.photoId || groups.reelId || '';
    case 'reddit':
      return groups.postId || groups.shortId || '';
    case 'pinterest':
      return groups.pinId || groups.shortId || '';
    case 'spotify':
      return groups.trackId || groups.albumId || groups.playlistId || groups.episodeId || groups.showId || groups.artistId || groups.shortId || '';
    case 'github':
      return groups.repo ? `${groups.owner}/${groups.repo}` : groups.gistId || '';
    case 'medium':
      return groups.postId || groups.slug || '';
    case 'substack':
      return groups.slug || '';
    case 'vimeo':
      return groups.videoId || '';
    case 'twitch':
      return groups.clipId || groups.videoId || '';
    case 'soundcloud':
      return groups.track || groups.playlist || groups.shortId || '';
    case 'mastodon':
      return groups.postId || '';
    default:
      return '';
  }
}

/**
 * Detect Mastodon instances that aren't in our pattern list
 */
function detectMastodonInstance(url: string): PlatformDetectionResult | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check known instances
    if (KNOWN_MASTODON_INSTANCES.includes(hostname)) {
      const pathMatch = parsed.pathname.match(/\/@(\w+)\/(\d+)/);
      if (pathMatch) {
        return {
          platform: 'mastodon',
          postId: pathMatch[2],
          params: {
            instance: hostname,
            username: pathMatch[1],
            postId: pathMatch[2],
          },
          supported: true,
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the oEmbed endpoint for a platform
 */
export function getOEmbedEndpoint(platform: SupportedPlatform): string | null {
  return OEMBED_ENDPOINTS[platform] || null;
}

/**
 * Build oEmbed URL with parameters
 */
export function buildOEmbedUrl(platform: SupportedPlatform, postUrl: string, options?: {
  maxWidth?: number;
  maxHeight?: number;
  theme?: 'light' | 'dark';
}): string | null {
  const endpoint = getOEmbedEndpoint(platform);
  if (!endpoint) return null;

  const params = new URLSearchParams({
    url: postUrl,
    format: 'json',
  });

  if (options?.maxWidth) {
    params.set('maxwidth', options.maxWidth.toString());
  }
  if (options?.maxHeight) {
    params.set('maxheight', options.maxHeight.toString());
  }
  if (options?.theme) {
    params.set('theme', options.theme);
  }

  // Platform-specific parameters
  if (platform === 'twitter') {
    params.set('omit_script', 'true');
    params.set('hide_thread', 'false');
  }

  return `${endpoint}?${params.toString()}`;
}

/**
 * Get platform display information
 */
export function getPlatformInfo(platform: SupportedPlatform): {
  name: string;
  color: string;
  icon: string;
  bgColor: string;
  textColor: string;
} {
  const platformInfo: Record<SupportedPlatform, { name: string; color: string; icon: string; bgColor: string; textColor: string }> = {
    twitter: { name: 'X (Twitter)', color: '#000000', icon: 'twitter', bgColor: '#000000', textColor: '#FFFFFF' },
    youtube: { name: 'YouTube', color: '#FF0000', icon: 'youtube', bgColor: '#FF0000', textColor: '#FFFFFF' },
    instagram: { name: 'Instagram', color: '#E4405F', icon: 'instagram', bgColor: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)', textColor: '#FFFFFF' },
    linkedin: { name: 'LinkedIn', color: '#0A66C2', icon: 'linkedin', bgColor: '#0A66C2', textColor: '#FFFFFF' },
    tiktok: { name: 'TikTok', color: '#000000', icon: 'tiktok', bgColor: '#000000', textColor: '#FFFFFF' },
    threads: { name: 'Threads', color: '#000000', icon: 'threads', bgColor: '#000000', textColor: '#FFFFFF' },
    bluesky: { name: 'Bluesky', color: '#0085FF', icon: 'bluesky', bgColor: '#0085FF', textColor: '#FFFFFF' },
    facebook: { name: 'Facebook', color: '#1877F2', icon: 'facebook', bgColor: '#1877F2', textColor: '#FFFFFF' },
    reddit: { name: 'Reddit', color: '#FF4500', icon: 'reddit', bgColor: '#FF4500', textColor: '#FFFFFF' },
    pinterest: { name: 'Pinterest', color: '#E60023', icon: 'pinterest', bgColor: '#E60023', textColor: '#FFFFFF' },
    spotify: { name: 'Spotify', color: '#1DB954', icon: 'spotify', bgColor: '#1DB954', textColor: '#FFFFFF' },
    github: { name: 'GitHub', color: '#333333', icon: 'github', bgColor: '#24292E', textColor: '#FFFFFF' },
    medium: { name: 'Medium', color: '#000000', icon: 'medium', bgColor: '#000000', textColor: '#FFFFFF' },
    substack: { name: 'Substack', color: '#FF6719', icon: 'substack', bgColor: '#FF6719', textColor: '#FFFFFF' },
    vimeo: { name: 'Vimeo', color: '#1AB7EA', icon: 'vimeo', bgColor: '#1AB7EA', textColor: '#FFFFFF' },
    twitch: { name: 'Twitch', color: '#9146FF', icon: 'twitch', bgColor: '#9146FF', textColor: '#FFFFFF' },
    soundcloud: { name: 'SoundCloud', color: '#FF5500', icon: 'soundcloud', bgColor: '#FF5500', textColor: '#FFFFFF' },
    mastodon: { name: 'Mastodon', color: '#6364FF', icon: 'mastodon', bgColor: '#6364FF', textColor: '#FFFFFF' },
    unknown: { name: 'Link', color: '#6B7280', icon: 'link', bgColor: '#6B7280', textColor: '#FFFFFF' },
  };

  return platformInfo[platform] || platformInfo.unknown;
}

/**
 * Get the Spotify content type from URL
 */
export function getSpotifyContentType(url: string): 'track' | 'album' | 'playlist' | 'episode' | 'show' | 'artist' | null {
  if (url.includes('/track/')) return 'track';
  if (url.includes('/album/')) return 'album';
  if (url.includes('/playlist/')) return 'playlist';
  if (url.includes('/episode/')) return 'episode';
  if (url.includes('/show/')) return 'show';
  if (url.includes('/artist/')) return 'artist';
  return null;
}

/**
 * Get the GitHub content type from URL
 */
export function getGitHubContentType(url: string): 'repo' | 'gist' | 'issue' | 'pull' | 'discussion' | null {
  if (url.includes('gist.github.com')) return 'gist';
  if (url.includes('/issues/')) return 'issue';
  if (url.includes('/pull/')) return 'pull';
  if (url.includes('/discussions/')) return 'discussion';
  // Default to repo for github.com/{owner}/{repo} URLs
  const repoPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/i;
  if (repoPattern.test(url)) return 'repo';
  return null;
}

/**
 * Check if YouTube URL is a Short
 */
export function isYouTubeShort(url: string): boolean {
  return url.includes('/shorts/');
}

/**
 * Normalize a social media URL to its canonical form
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'ref_src', 'ref_url', 's', 't', 'si'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    
    // Platform-specific normalization
    if (parsed.hostname.includes('twitter.com') || parsed.hostname.includes('x.com')) {
      // Normalize x.com to twitter.com for consistency
      parsed.hostname = 'twitter.com';
    }
    
    return parsed.toString();
  } catch {
    return url;
  }
}
