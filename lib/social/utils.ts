// Social Media Utilities
// Helper functions for formatting, parsing, and display

import { SocialMetrics, SupportedPlatform } from './types';

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format large numbers in a compact way (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
}

/**
 * Format view count in YouTube style
 */
export function formatViewCount(views: number | undefined): string {
  if (views === undefined || views === null) return '0 views';
  
  const formatted = formatCompactNumber(views);
  return `${formatted} views`;
}

/**
 * Format like count
 */
export function formatLikeCount(likes: number | undefined): string {
  if (likes === undefined || likes === null) return '0';
  return formatCompactNumber(likes);
}

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format date in Twitter style (e.g., "2:30 PM · Dec 13, 2024")
 */
export function formatTwitterDate(date: Date | string): string {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const dateStr = d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  return `${time} · ${dateStr}`;
}

/**
 * Format relative time (e.g., "2h ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
}

/**
 * Format Instagram-style timestamp
 */
export function formatInstagramTime(date: Date | string): string {
  const relative = formatRelativeTime(date);
  if (relative === 'just now') return 'NOW';
  return relative.toUpperCase();
}

/**
 * Format YouTube duration from ISO 8601 (PT1H2M3S)
 */
export function formatYouTubeDuration(duration: string | number): string {
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Parse ISO 8601 duration
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0590-\u05ff]+/g);
  return matches ? matches.map(tag => tag.slice(1)) : [];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w]+/g);
  return matches ? matches.map(mention => mention.slice(1)) : [];
}

/**
 * Parse tweet text and return segments for rendering
 */
export interface TextSegment {
  type: 'text' | 'hashtag' | 'mention' | 'url';
  content: string;
  url?: string;
}

export function parseTwitterText(
  text: string,
  entities?: {
    hashtags?: Array<{ tag: string; indices: [number, number] }>;
    mentions?: Array<{ username: string; indices: [number, number] }>;
    urls?: Array<{ url: string; displayUrl: string; expandedUrl: string; indices: [number, number] }>;
  }
): TextSegment[] {
  if (!entities) {
    return [{ type: 'text', content: text }];
  }

  // Collect all entities with their positions
  const allEntities: Array<{
    type: TextSegment['type'];
    start: number;
    end: number;
    content: string;
    url?: string;
  }> = [];

  entities.hashtags?.forEach(h => {
    allEntities.push({
      type: 'hashtag',
      start: h.indices[0],
      end: h.indices[1],
      content: h.tag,
      url: `https://twitter.com/hashtag/${h.tag}`,
    });
  });

  entities.mentions?.forEach(m => {
    allEntities.push({
      type: 'mention',
      start: m.indices[0],
      end: m.indices[1],
      content: m.username,
      url: `https://twitter.com/${m.username}`,
    });
  });

  entities.urls?.forEach(u => {
    allEntities.push({
      type: 'url',
      start: u.indices[0],
      end: u.indices[1],
      content: u.displayUrl,
      url: u.expandedUrl,
    });
  });

  // Sort by start position
  allEntities.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  allEntities.forEach(entity => {
    // Add text before this entity
    if (entity.start > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, entity.start),
      });
    }

    // Add the entity
    segments.push({
      type: entity.type,
      content: entity.content,
      url: entity.url,
    });

    currentIndex = entity.end;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(currentIndex),
    });
  }

  return segments;
}

// ============================================================================
// METRICS FORMATTING
// ============================================================================

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: SocialMetrics): {
  likes: string;
  comments: string;
  shares: string;
  views: string;
} {
  return {
    likes: formatCompactNumber(metrics.likes),
    comments: formatCompactNumber(metrics.comments),
    shares: formatCompactNumber(metrics.shares || metrics.retweets),
    views: formatCompactNumber(metrics.views),
  };
}

// ============================================================================
// PLATFORM-SPECIFIC UTILITIES
// ============================================================================

/**
 * Get platform-specific theme colors
 */
export function getPlatformColors(platform: SupportedPlatform, theme: 'light' | 'dark') {
  const colors: Record<SupportedPlatform, { light: Record<string, string>; dark: Record<string, string> }> = {
    twitter: {
      dark: {
        bg: '#000000',
        cardBg: '#16181C',
        border: '#2F3336',
        text: '#E7E9EA',
        textSecondary: '#71767B',
        link: '#1D9BF0',
        verified: '#1D9BF0',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#EFF3F4',
        text: '#0F1419',
        textSecondary: '#536471',
        link: '#1D9BF0',
        verified: '#1D9BF0',
      },
    },
    youtube: {
      dark: {
        bg: '#0F0F0F',
        cardBg: '#272727',
        border: '#3F3F3F',
        text: '#F1F1F1',
        textSecondary: '#AAAAAA',
        red: '#FF0000',
        link: '#3EA6FF',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#0F0F0F',
        textSecondary: '#606060',
        red: '#FF0000',
        link: '#065FD4',
      },
    },
    instagram: {
      dark: {
        bg: '#000000',
        cardBg: '#000000',
        border: '#262626',
        text: '#F5F5F5',
        textSecondary: '#A8A8A8',
        link: '#E0F1FF',
        gradient: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#DBDBDB',
        text: '#262626',
        textSecondary: '#8E8E8E',
        link: '#00376B',
        gradient: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
      },
    },
    linkedin: {
      dark: {
        bg: '#1B1F23',
        cardBg: '#1B1F23',
        border: '#38434F',
        text: '#FFFFFF',
        textSecondary: '#FFFFFFB3',
        link: '#71B7FB',
        blue: '#0A66C2',
      },
      light: {
        bg: '#F4F2EE',
        cardBg: '#FFFFFF',
        border: '#E0DFDC',
        text: '#000000E6',
        textSecondary: '#00000099',
        link: '#0A66C2',
        blue: '#0A66C2',
      },
    },
    tiktok: {
      dark: {
        bg: '#121212',
        cardBg: '#1F1F1F',
        border: '#2F2F2F',
        text: '#FFFFFF',
        textSecondary: '#8A8B91',
        pink: '#FE2C55',
        cyan: '#25F4EE',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E3E3E4',
        text: '#161823',
        textSecondary: '#75767B',
        pink: '#FE2C55',
        cyan: '#25F4EE',
      },
    },
    reddit: {
      dark: {
        bg: '#0B1416',
        cardBg: '#1A1A1B',
        border: '#343536',
        text: '#D7DADC',
        textSecondary: '#818384',
        orange: '#FF4500',
        link: '#4FBCFF',
      },
      light: {
        bg: '#DAE0E6',
        cardBg: '#FFFFFF',
        border: '#EDEFF1',
        text: '#1C1C1C',
        textSecondary: '#787C7E',
        orange: '#FF4500',
        link: '#0079D3',
      },
    },
    spotify: {
      dark: {
        bg: '#121212',
        cardBg: '#181818',
        border: '#282828',
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
        green: '#1DB954',
        link: '#1DB954',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#000000',
        textSecondary: '#6A6A6A',
        green: '#1DB954',
        link: '#1DB954',
      },
    },
    github: {
      dark: {
        bg: '#0D1117',
        cardBg: '#161B22',
        border: '#30363D',
        text: '#E6EDF3',
        textSecondary: '#8B949E',
        link: '#58A6FF',
        green: '#238636',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#D0D7DE',
        text: '#1F2328',
        textSecondary: '#656D76',
        link: '#0969DA',
        green: '#1A7F37',
      },
    },
    threads: {
      dark: {
        bg: '#101010',
        cardBg: '#181818',
        border: '#323232',
        text: '#F5F5F5',
        textSecondary: '#777777',
        link: '#FFFFFF',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E0E0E0',
        text: '#000000',
        textSecondary: '#999999',
        link: '#000000',
      },
    },
    bluesky: {
      dark: {
        bg: '#16202A',
        cardBg: '#1E2A37',
        border: '#2E3E4E',
        text: '#FFFFFF',
        textSecondary: '#8BA1B8',
        link: '#208BFE',
        blue: '#0085FF',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E4E8EC',
        text: '#2A3644',
        textSecondary: '#66788A',
        link: '#0066CC',
        blue: '#0085FF',
      },
    },
    facebook: {
      dark: {
        bg: '#18191A',
        cardBg: '#242526',
        border: '#3E4042',
        text: '#E4E6EB',
        textSecondary: '#B0B3B8',
        blue: '#2374E1',
        link: '#2374E1',
      },
      light: {
        bg: '#F0F2F5',
        cardBg: '#FFFFFF',
        border: '#E4E6EB',
        text: '#050505',
        textSecondary: '#65676B',
        blue: '#1877F2',
        link: '#1877F2',
      },
    },
    pinterest: {
      dark: {
        bg: '#111111',
        cardBg: '#1E1E1E',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#ABABAB',
        red: '#E60023',
        link: '#E60023',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#EFEFEF',
        text: '#333333',
        textSecondary: '#767676',
        red: '#E60023',
        link: '#E60023',
      },
    },
    medium: {
      dark: {
        bg: '#121212',
        cardBg: '#1A1A1A',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        green: '#1A8917',
        link: '#FFFFFF',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E6E6E6',
        text: '#242424',
        textSecondary: '#6B6B6B',
        green: '#1A8917',
        link: '#242424',
      },
    },
    substack: {
      dark: {
        bg: '#121212',
        cardBg: '#1A1A1A',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#999999',
        orange: '#FF6719',
        link: '#FF6719',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#1A1A1A',
        textSecondary: '#6A6A6A',
        orange: '#FF6719',
        link: '#FF6719',
      },
    },
    vimeo: {
      dark: {
        bg: '#1A1A1A',
        cardBg: '#262626',
        border: '#404040',
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
        blue: '#1AB7EA',
        link: '#1AB7EA',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#1A1A1A',
        textSecondary: '#6A6A6A',
        blue: '#1AB7EA',
        link: '#1AB7EA',
      },
    },
    twitch: {
      dark: {
        bg: '#0E0E10',
        cardBg: '#18181B',
        border: '#26262C',
        text: '#EFEFF1',
        textSecondary: '#ADADB8',
        purple: '#9146FF',
        link: '#BF94FF',
      },
      light: {
        bg: '#F7F7F8',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#0E0E10',
        textSecondary: '#53535F',
        purple: '#9146FF',
        link: '#772CE8',
      },
    },
    soundcloud: {
      dark: {
        bg: '#111111',
        cardBg: '#1A1A1A',
        border: '#333333',
        text: '#FFFFFF',
        textSecondary: '#999999',
        orange: '#FF5500',
        link: '#FF5500',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#333333',
        textSecondary: '#999999',
        orange: '#FF5500',
        link: '#FF5500',
      },
    },
    mastodon: {
      dark: {
        bg: '#191B22',
        cardBg: '#282C37',
        border: '#393F4F',
        text: '#FFFFFF',
        textSecondary: '#9BAEC8',
        purple: '#6364FF',
        link: '#8C8DFF',
      },
      light: {
        bg: '#F2F5F7',
        cardBg: '#FFFFFF',
        border: '#C0CDD9',
        text: '#282C37',
        textSecondary: '#606984',
        purple: '#6364FF',
        link: '#6364FF',
      },
    },
    unknown: {
      dark: {
        bg: '#1A1A1A',
        cardBg: '#262626',
        border: '#404040',
        text: '#FFFFFF',
        textSecondary: '#999999',
        link: '#60A5FA',
      },
      light: {
        bg: '#FFFFFF',
        cardBg: '#FFFFFF',
        border: '#E5E5E5',
        text: '#1A1A1A',
        textSecondary: '#6B7280',
        link: '#2563EB',
      },
    },
  };

  return colors[platform]?.[theme] || colors.unknown[theme];
}

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowercaseUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
}

/**
 * Check if URL is a video
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
}

/**
 * Generate proxy URL for images (to avoid CORS issues)
 */
export function getProxyImageUrl(url: string): string {
  // For now, return the original URL
  // In production, you'd route through your own proxy
  return url;
}
