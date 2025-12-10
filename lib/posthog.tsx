"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * PostHog Analytics Provider for Miza
 * 
 * DSGVO/GDPR compliant setup:
 * - Uses EU region by default
 * - Starts with memory persistence (no cookies until consent)
 * - Manual pageview tracking for better control
 */
export function PosthogProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialized) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com";

    if (!posthogKey) {
      console.warn("PostHog key not configured - analytics disabled");
      return;
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      // GDPR/DSGVO settings
      capture_pageview: false, // Manual control
      capture_pageleave: false,
      persistence: "memory", // No cookies until consent
      autocapture: false, // Manual event tracking only
      // Privacy settings
      disable_session_recording: true, // Enable only after consent
      opt_out_capturing_by_default: false,
      // Performance
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          // Disable in development by default
          posthog.opt_out_capturing();
        }
      },
    });

    setIsInitialized(true);
  }, [isInitialized]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

/**
 * Hook to track page views manually
 */
export function usePageView(pageName: string) {
  useEffect(() => {
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      page_name: pageName,
    });
  }, [pageName]);
}

/**
 * Enable full tracking after user consent
 */
export function enableFullTracking() {
  posthog.opt_in_capturing();
  posthog.set_config({
    persistence: "localStorage",
    disable_session_recording: false,
  });
}

/**
 * Disable all tracking (user revokes consent)
 */
export function disableTracking() {
  posthog.opt_out_capturing();
  posthog.reset();
}

/**
 * Check if user has consented to tracking
 */
export function hasConsented(): boolean {
  return !posthog.has_opted_out_capturing();
}

/**
 * Track custom events
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (posthog.has_opted_out_capturing()) return;
  posthog.capture(eventName, properties);
}

/**
 * Identify user (after login)
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthog.identify(userId, properties);
}

/**
 * Reset user identity (after logout)
 */
export function resetUser() {
  posthog.reset();
}

// Pre-defined event names for consistency
export const ANALYTICS_EVENTS = {
  // Auth events
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  
  // Document events
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_VIEWED: "document_viewed",
  DOCUMENT_DELETED: "document_deleted",
  
  // Search events
  SEARCH_PERFORMED: "search_performed",
  SEARCH_RESULT_CLICKED: "search_result_clicked",
  
  // Chat events
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_SESSION_STARTED: "chat_session_started",
  
  // Feature usage
  SUMMARY_GENERATED: "summary_generated",
  QUIZ_GENERATED: "quiz_generated",
} as const;
