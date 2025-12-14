import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MizaBot/1.0; +https://miza.app/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'fetch_failed', message: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    
    // Parse OpenGraph and meta tags using regex (simple server-side parsing)
    const ogData = parseOpenGraphFromHtml(html, url);

    return NextResponse.json(ogData);
  } catch (error) {
    console.error('OpenGraph scrape error:', error);
    return NextResponse.json(
      { error: 'scrape_error', message: 'Failed to scrape URL' },
      { status: 500 }
    );
  }
}

function parseOpenGraphFromHtml(html: string, url: string) {
  const getMeta = (property: string): string | undefined => {
    // Try og: prefix
    const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
    if (ogMatch) return decodeHtmlEntities(ogMatch[1]);

    // Try content first format
    const ogMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i'));
    if (ogMatch2) return decodeHtmlEntities(ogMatch2[1]);

    // Try name attribute
    const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
    if (nameMatch) return decodeHtmlEntities(nameMatch[1]);

    // Try content first format with name
    const nameMatch2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'));
    if (nameMatch2) return decodeHtmlEntities(nameMatch2[1]);

    return undefined;
  };

  const getTwitterMeta = (property: string): string | undefined => {
    const match = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
    if (match) return decodeHtmlEntities(match[1]);

    const match2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${property}["']`, 'i'));
    if (match2) return decodeHtmlEntities(match2[1]);

    return undefined;
  };

  // Get title
  let title = getMeta('title');
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = decodeHtmlEntities(titleMatch[1]);
  }

  // Get description
  let description = getMeta('description');
  if (!description) {
    description = getMeta('description'); // Try name="description"
  }

  // Get image
  let image = getMeta('image');
  if (image && !image.startsWith('http')) {
    // Make relative URLs absolute
    try {
      const baseUrl = new URL(url);
      image = new URL(image, baseUrl.origin).toString();
    } catch {
      // Keep as is
    }
  }

  return {
    title,
    description,
    image,
    imageWidth: getMeta('image:width') ? parseInt(getMeta('image:width')!, 10) : undefined,
    imageHeight: getMeta('image:height') ? parseInt(getMeta('image:height')!, 10) : undefined,
    siteName: getMeta('site_name'),
    type: getMeta('type'),
    url: getMeta('url') || url,
    author: getMeta('author') || getMeta('article:author'),
    publishedTime: getMeta('article:published_time'),
    twitterCard: getTwitterMeta('card'),
    twitterSite: getTwitterMeta('site'),
    twitterCreator: getTwitterMeta('creator'),
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}
