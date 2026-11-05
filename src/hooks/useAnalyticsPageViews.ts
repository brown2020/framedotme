import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import {
  hasAnalyticsConsent,
  subscribeToAnalyticsConsent,
  trackPageView,
} from "@/services/analyticsService";

function getServerAnalyticsConsent(): boolean {
  return false;
}

/**
 * Logs page_view for the current route and each later client navigation.
 * Analytics stays off until the visitor accepts the existing cookie banner,
 * including on a later visit when that choice is already stored.
 */
export function useAnalyticsPageViews(): void {
  const pathname = usePathname();
  const hasConsent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    hasAnalyticsConsent,
    getServerAnalyticsConsent,
  );

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    let cancelled = false;
    void trackPageView(pathname, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [hasConsent, pathname]);
}
