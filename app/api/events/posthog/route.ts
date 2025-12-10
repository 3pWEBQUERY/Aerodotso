import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/events/posthog
 * Proxy endpoint for PostHog events (optional, for additional privacy)
 * 
 * This allows you to:
 * - Filter events before they reach PostHog
 * - Add server-side context
 * - Ensure EU data residency
 */
export async function POST(req: NextRequest) {
  try {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com";
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!posthogKey) {
      return NextResponse.json(
        { error: "PostHog not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();

    // Optional: Filter or modify events before forwarding
    // You can add server-side context or remove sensitive data here
    const sanitizedBody = sanitizeEventData(body);

    // Forward to PostHog
    const response = await fetch(`${posthogHost}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: posthogKey,
        ...sanitizedBody,
      }),
    });

    if (!response.ok) {
      console.error("PostHog forward error:", await response.text());
      return NextResponse.json(
        { error: "Failed to forward event" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PostHog proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Sanitize event data before forwarding to PostHog
 * Remove any PII or sensitive information
 */
function sanitizeEventData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // Remove potential PII from properties
  if (sanitized.properties && typeof sanitized.properties === "object") {
    const props = sanitized.properties as Record<string, unknown>;
    
    // Remove email addresses
    delete props.$email;
    delete props.email;
    
    // Remove IP addresses (PostHog can do this, but belt and suspenders)
    delete props.$ip;
    
    // Remove any custom PII fields you might have
    delete props.phone;
    delete props.address;
    delete props.full_name;
  }

  return sanitized;
}

/**
 * GET /api/events/posthog
 * Health check endpoint
 */
export async function GET() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  return NextResponse.json({
    status: posthogKey ? "configured" : "not_configured",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
  });
}
