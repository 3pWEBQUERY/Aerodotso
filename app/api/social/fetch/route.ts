import { NextRequest, NextResponse } from 'next/server';
import { fetchSocialPost } from '@/lib/social/fetchers';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'url_required', message: 'URL is required' },
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
