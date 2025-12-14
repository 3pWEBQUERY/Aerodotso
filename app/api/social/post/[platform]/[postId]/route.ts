import { NextRequest, NextResponse } from 'next/server';
import { fetchSocialPost } from '@/lib/social/fetchers';
import { SupportedPlatform } from '@/lib/social/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; postId: string }> }
) {
  try {
    const { platform, postId } = await params;

    if (!platform || !postId) {
      return NextResponse.json(
        { error: 'invalid_params', message: 'Platform and postId are required' },
        { status: 400 }
      );
    }

    // Reconstruct URL based on platform
    const url = reconstructUrl(platform as SupportedPlatform, postId);
    
    if (!url) {
      return NextResponse.json(
        { error: 'unsupported_platform', message: `Platform "${platform}" is not supported` },
        { status: 400 }
      );
    }

    const post = await fetchSocialPost(url);

    return NextResponse.json(post);
  } catch (error) {
    console.error('Social post fetch error:', error);
    return NextResponse.json(
      { 
        error: 'fetch_error', 
        message: error instanceof Error ? error.message : 'Failed to fetch post' 
      },
      { status: 500 }
    );
  }
}

function reconstructUrl(platform: SupportedPlatform, postId: string): string | null {
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/i/web/status/${postId}`;
    case 'youtube':
      return `https://www.youtube.com/watch?v=${postId}`;
    case 'instagram':
      return `https://www.instagram.com/p/${postId}`;
    case 'tiktok':
      return `https://www.tiktok.com/@user/video/${postId}`;
    case 'reddit':
      return `https://www.reddit.com/comments/${postId}`;
    case 'github':
      // postId is owner/repo format
      return `https://github.com/${postId}`;
    case 'spotify':
      return `https://open.spotify.com/track/${postId}`;
    case 'vimeo':
      return `https://vimeo.com/${postId}`;
    case 'threads':
      return `https://www.threads.net/t/${postId}`;
    case 'bluesky':
      return `https://bsky.app/profile/user/post/${postId}`;
    default:
      return null;
  }
}
