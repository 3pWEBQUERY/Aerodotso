"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration Component
 * 
 * Registers the PWA service worker for offline support
 * Include this in your app layout for PWA functionality
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      console.log("Service Workers not supported");
      return;
    }

    // Only register in production or when explicitly enabled
    const shouldRegister =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_SW === "true";

    if (!shouldRegister) {
      console.log("Service Worker registration skipped in development");
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("Service Worker registered:", registration.scope);

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content available, notify user
                console.log("New content available, refresh to update");
                // You can dispatch a custom event or show a toast here
                window.dispatchEvent(new CustomEvent("sw-update-available"));
              }
            });
          }
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    // Wait for page load before registering
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}

/**
 * Hook to listen for service worker updates
 */
export function useServiceWorkerUpdate(onUpdate: () => void) {
  useEffect(() => {
    const handler = () => onUpdate();
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, [onUpdate]);
}

/**
 * Force refresh when a new service worker is available
 */
export function forceRefresh() {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }
}

export default ServiceWorkerRegister;
