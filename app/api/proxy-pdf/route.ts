import { NextRequest, NextResponse } from "next/server";

// Simple proxy to fetch PDFs server-side to avoid client-side CORS/fetch issues.
// Usage: /api/proxy-pdf?url=<encoded target url>
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/pdf";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    console.error("proxy-pdf fetch failed", err);
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
