"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * PlausibleRouteTracker
 * - Sends a Plausible pageview event on client-side route changes (Next.js App Router)
 * - No PII is sent; only the current URL is attached
 * - Guarded by NEXT_PUBLIC_PLAUSIBLE_ENABLED (default enabled)
 */
export default function PlausibleRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Allow instant rollback if needed
    if (process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED === "false") {
      return;
    }

    const url = `${window.location.pathname}${window.location.search}`;

    // Avoid duplicate sends for the same URL
    if (lastUrlRef.current === url) return;
    lastUrlRef.current = url;

    // Fire Plausible pageview if script is present
    try {
      // @ts-expect-error plausible is injected by script
      if (typeof window !== "undefined" && typeof window.plausible === "function") {
        // Attach full href as recommended for SPA tracking accuracy
        // Ref: https://plausible.io/docs/custom-event-goals#pageview-goals
        // @ts-expect-error plausible global
        window.plausible("pageview", { u: window.location.href });
      }
    } catch {
      // Swallow errors to avoid affecting app UX
    }
  }, [pathname, searchParams]);

  return null;
}


