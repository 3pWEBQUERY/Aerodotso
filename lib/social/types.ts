// Social Media Post Cards - Type Definitions
// Comprehensive types for all supported social media platforms

// ============================================================================
// SUPPORTED PLATFORMS
// ============================================================================

export type SupportedPlatform =
  | 'twitter'
  | 'youtube'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'threads'
  | 'bluesky'
  | 'facebook'
  | 'reddit'
  | 'pinterest'
  | 'spotify'
  | 'github'
  | 'medium'
  | 'substack'
  | 'vimeo'
  | 'twitch'
  | 'soundcloud'
  | 'mastodon'
  | 'unknown';

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseSocialPost {
  id: string;
  platform: SupportedPlatform;
  url: string;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface SocialAuthor {
  id?: string;
  name: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
  followerCount?: number;
  profileUrl: string;
}

export interface SocialMedia {
  type: 'image' | 'video' | 'gif' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // in seconds for video/audio
  altText?: string;
}

export interface SocialMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  retweets?: number;
  views?: number;
  plays?: number;
  saves?: number;
}

// ============================================================================
// PLATFORM-SPECIFIC INTERFACES
// ============================================================================

// Twitter/X
export interface TwitterPost extends BaseSocialPost {
  platform: 'twitter';
  author: SocialAuthor;
  content: {
    text: string;
    entities?: {
      hashtags?: Array<{ tag: string; indices: [number, number] }>;
      mentions?: Array<{ username: string; indices: [number, number] }>;
      urls?: Array<{ url: string; displayUrl: string; expandedUrl: string; indices: [number, number] }>;
    };
  };
  media?: SocialMedia[];
  metrics: SocialMetrics;
  quotedPost?: TwitterPost;
  replyTo?: { postId: string; username: string };
  createdAt: Date;
  isThread?: boolean;
  threadPosts?: TwitterPost[];
}

// YouTube
export interface YouTubeVideo extends BaseSocialPost {
  platform: 'youtube';
  author: SocialAuthor & { subscriberCount?: number };
  content: {
    title: string;
    description: string;
    tags?: string[];
  };
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
  metrics: SocialMetrics & {
    likes: number;
    dislikes?: number;
    comments: number;
  };
  duration: string; // ISO 8601 duration
  publishedAt: Date;
  isShort: boolean;
  isLive: boolean;
  category?: string;
  videoId: string;
}

// Instagram
export interface InstagramPost extends BaseSocialPost {
  platform: 'instagram';
  author: SocialAuthor;
  content: {
    caption?: string;
    hashtags?: string[];
    mentions?: string[];
  };
  media: SocialMedia[];
  metrics: SocialMetrics;
  postType: 'image' | 'video' | 'carousel' | 'reel';
  createdAt: Date;
  location?: {
    name: string;
    id?: string;
  };
}

// LinkedIn
export interface LinkedInPost extends BaseSocialPost {
  platform: 'linkedin';
  author: SocialAuthor & {
    headline?: string;
    company?: string;
  };
  content: {
    text: string;
    articleTitle?: string;
    articleDescription?: string;
    articleImage?: string;
  };
  media?: SocialMedia[];
  metrics: SocialMetrics & { impressions?: number };
  postType: 'text' | 'image' | 'video' | 'article' | 'document' | 'poll';
  createdAt: Date;
}

// TikTok
export interface TikTokVideo extends BaseSocialPost {
  platform: 'tiktok';
  author: SocialAuthor;
  content: {
    description: string;
    hashtags?: string[];
    sounds?: { name: string; author: string };
  };
  video: SocialMedia & {
    coverImage: string;
    playCount: number;
  };
  metrics: SocialMetrics;
  createdAt: Date;
  duet?: { originalVideo: string };
  stitch?: { originalVideo: string };
}

// Threads
export interface ThreadsPost extends BaseSocialPost {
  platform: 'threads';
  author: SocialAuthor;
  content: {
    text: string;
    entities?: {
      hashtags?: Array<{ tag: string }>;
      mentions?: Array<{ username: string }>;
    };
  };
  media?: SocialMedia[];
  metrics: SocialMetrics;
  createdAt: Date;
  replyTo?: { postId: string; username: string };
}

// Bluesky
export interface BlueskyPost extends BaseSocialPost {
  platform: 'bluesky';
  author: SocialAuthor;
  content: {
    text: string;
    facets?: Array<{
      type: 'mention' | 'link' | 'tag';
      value: string;
      indices: [number, number];
    }>;
  };
  media?: SocialMedia[];
  metrics: SocialMetrics;
  createdAt: Date;
  quotedPost?: BlueskyPost;
}

// Facebook
export interface FacebookPost extends BaseSocialPost {
  platform: 'facebook';
  author: SocialAuthor;
  content: {
    text?: string;
    sharedLink?: {
      url: string;
      title?: string;
      description?: string;
      image?: string;
    };
  };
  media?: SocialMedia[];
  metrics: SocialMetrics;
  postType: 'text' | 'photo' | 'video' | 'link' | 'event';
  createdAt: Date;
}

// Reddit
export interface RedditPost extends BaseSocialPost {
  platform: 'reddit';
  author: SocialAuthor & { karma?: number };
  subreddit: {
    name: string;
    displayName: string;
    icon?: string;
    subscribers?: number;
  };
  content: {
    title: string;
    selftext?: string;
    flair?: { text: string; backgroundColor?: string };
  };
  media?: SocialMedia[];
  metrics: {
    upvotes: number;
    downvotes?: number;
    upvoteRatio?: number;
    comments: number;
    awards?: Array<{ name: string; count: number; icon: string }>;
  };
  postType: 'text' | 'image' | 'video' | 'link' | 'gallery' | 'poll';
  isNSFW: boolean;
  isSpoiler: boolean;
  createdAt: Date;
  permalink: string;
}

// Pinterest
export interface PinterestPin extends BaseSocialPost {
  platform: 'pinterest';
  author: SocialAuthor;
  content: {
    title?: string;
    description?: string;
  };
  media: SocialMedia;
  metrics: SocialMetrics;
  board?: {
    name: string;
    url: string;
  };
  sourceUrl?: string;
  createdAt: Date;
}

// Spotify
export interface SpotifyContent extends BaseSocialPost {
  platform: 'spotify';
  contentType: 'track' | 'album' | 'playlist' | 'episode' | 'show' | 'artist';
  name: string;
  artists: Array<{ name: string; url: string }>;
  album?: {
    name: string;
    image: string;
    releaseDate: string;
  };
  coverImage: string;
  duration: number;
  previewUrl?: string;
  explicit: boolean;
  popularity?: number;
}

// GitHub
export interface GitHubRepo extends BaseSocialPost {
  platform: 'github';
  contentType: 'repo' | 'gist' | 'issue' | 'pull' | 'discussion';
  owner: SocialAuthor;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  languageColor?: string;
  metrics: {
    stars: number;
    forks: number;
    watchers: number;
    issues?: number;
  };
  topics?: string[];
  license?: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  defaultBranch?: string;
}

// Medium
export interface MediumArticle extends BaseSocialPost {
  platform: 'medium';
  author: SocialAuthor;
  content: {
    title: string;
    subtitle?: string;
    previewContent?: string;
  };
  thumbnail?: string;
  metrics: {
    claps?: number;
    responses?: number;
  };
  readingTime?: number; // minutes
  publishedAt: Date;
  publication?: {
    name: string;
    logo?: string;
  };
  tags?: string[];
}

// Substack
export interface SubstackPost extends BaseSocialPost {
  platform: 'substack';
  author: SocialAuthor;
  content: {
    title: string;
    subtitle?: string;
    previewContent?: string;
  };
  thumbnail?: string;
  metrics: {
    likes?: number;
    comments?: number;
  };
  publishedAt: Date;
  publication: {
    name: string;
    logo?: string;
  };
  isPaid: boolean;
}

// Vimeo
export interface VimeoVideo extends BaseSocialPost {
  platform: 'vimeo';
  author: SocialAuthor;
  content: {
    title: string;
    description?: string;
  };
  thumbnail: string;
  duration: number;
  metrics: SocialMetrics;
  createdAt: Date;
  videoId: string;
}

// Twitch
export interface TwitchClip extends BaseSocialPost {
  platform: 'twitch';
  author: SocialAuthor;
  content: {
    title: string;
    game?: string;
  };
  thumbnail: string;
  duration: number;
  metrics: SocialMetrics;
  createdAt: Date;
  clipId: string;
  broadcaster: SocialAuthor;
}

// SoundCloud
export interface SoundCloudTrack extends BaseSocialPost {
  platform: 'soundcloud';
  author: SocialAuthor;
  content: {
    title: string;
    description?: string;
  };
  artwork?: string;
  duration: number;
  waveformUrl?: string;
  metrics: SocialMetrics;
  genre?: string;
  createdAt: Date;
}

// Mastodon
export interface MastodonPost extends BaseSocialPost {
  platform: 'mastodon';
  author: SocialAuthor;
  instance: string;
  content: {
    text: string;
    spoilerText?: string;
  };
  media?: SocialMedia[];
  metrics: SocialMetrics;
  createdAt: Date;
  visibility: 'public' | 'unlisted' | 'private' | 'direct';
}

// Generic/Fallback for OpenGraph
export interface GenericSocialPost extends BaseSocialPost {
  platform: 'unknown';
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    imageWidth?: number;
    imageHeight?: number;
    siteName?: string;
    type?: string;
    author?: string;
    publishedTime?: string;
  };
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type SocialPost =
  | TwitterPost
  | YouTubeVideo
  | InstagramPost
  | LinkedInPost
  | TikTokVideo
  | ThreadsPost
  | BlueskyPost
  | FacebookPost
  | RedditPost
  | PinterestPin
  | SpotifyContent
  | GitHubRepo
  | MediumArticle
  | SubstackPost
  | VimeoVideo
  | TwitchClip
  | SoundCloudTrack
  | MastodonPost
  | GenericSocialPost;

// ============================================================================
// FETCH & ERROR TYPES
// ============================================================================

export type FetchErrorType =
  | 'not_found'
  | 'private'
  | 'rate_limited'
  | 'network'
  | 'unsupported'
  | 'auth_required'
  | 'unknown';

export interface FetchError {
  type: FetchErrorType;
  message: string;
  platform: SupportedPlatform;
  statusCode?: number;
}

export interface PlatformDetectionResult {
  platform: SupportedPlatform;
  postId: string;
  params: Record<string, string>;
  supported: boolean;
}

// ============================================================================
// OEMBED TYPES
// ============================================================================

export interface OEmbedResponse {
  type: 'rich' | 'video' | 'photo' | 'link';
  version: string;
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  cache_age?: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  width?: number;
  height?: number;
  url?: string;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CachedSocialPost {
  id: string;
  platform: SupportedPlatform;
  postId: string;
  url: string;
  data: SocialPost;
  fetchedAt: Date;
  expiresAt: Date;
  archived: boolean;
  archivedAt?: Date;
}

export const CACHE_TTL: Record<SupportedPlatform | 'default', number> = {
  twitter: 15 * 60,       // 15 minutes
  instagram: 30 * 60,     // 30 minutes
  linkedin: 60 * 60,      // 1 hour
  tiktok: 15 * 60,        // 15 minutes
  threads: 30 * 60,       // 30 minutes
  bluesky: 15 * 60,       // 15 minutes
  facebook: 30 * 60,      // 30 minutes
  youtube: 4 * 60 * 60,   // 4 hours
  vimeo: 24 * 60 * 60,    // 24 hours
  spotify: 24 * 60 * 60,  // 24 hours
  github: 60 * 60,        // 1 hour
  reddit: 15 * 60,        // 15 minutes
  pinterest: 60 * 60,     // 1 hour
  medium: 4 * 60 * 60,    // 4 hours
  substack: 4 * 60 * 60,  // 4 hours
  twitch: 30 * 60,        // 30 minutes
  soundcloud: 60 * 60,    // 1 hour
  mastodon: 15 * 60,      // 15 minutes
  unknown: 30 * 60,       // 30 minutes
  default: 30 * 60,       // 30 minutes
};

// ============================================================================
// DISPLAY TYPES
// ============================================================================

export type DisplayMode = 'compact' | 'full' | 'expanded';
export type CardTheme = 'light' | 'dark' | 'auto';

export interface SocialCardDisplayOptions {
  displayMode: DisplayMode;
  theme: CardTheme;
  showMetrics: boolean;
  showTimestamp: boolean;
  enableInteraction: boolean;
  maxWidth?: number;
  maxHeight?: number;
}
