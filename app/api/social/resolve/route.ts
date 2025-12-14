import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, isValidUrl } from '@/lib/social/platform-detector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'invalid_url', message: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'invalid_url', message: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const result = detectPlatform(url);

    if (!result) {
      return NextResponse.json({
        supported: false,
        fallback: 'opengraph',
        url,
      });
    }

    return NextResponse.json({
      supported: true,
      platform: result.platform,
      postId: result.postId,
      params: result.params,
      url,
    });
  } catch (error) {
    console.error('Social resolve error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to resolve URL' },
      { status: 500 }
    );
  }
}
