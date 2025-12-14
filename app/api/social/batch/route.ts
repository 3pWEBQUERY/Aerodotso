import { NextRequest, NextResponse } from 'next/server';
import { fetchSocialPostsBatch } from '@/lib/social/fetchers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'URLs must be an array' },
        { status: 400 }
      );
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'At least one URL is required' },
        { status: 400 }
      );
    }

    if (urls.length > 20) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Maximum 20 URLs per batch' },
        { status: 400 }
      );
    }

    const results = await fetchSocialPostsBatch(urls);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Social batch fetch error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to process batch request' },
      { status: 500 }
    );
  }
}
