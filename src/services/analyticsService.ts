import type { Analytics } from "firebase/analytics";
import {
  defaultCookieConsentName,
  getCookieConsentValue,
} from "react-cookie-consent";

import { app } from "@/firebase/firebaseClient";
import { logger } from "@/utils/logger";

/**
 * Same cookie the existing banner writes when the visitor clicks accept.
 * Returning visitors who already accepted are treated as consented.
 */
export const ANALYTICS_CONSENT_COOKIE_NAME = defaultCookieConsentName;

const notCancelled = (): boolean => false;

const consentListeners = new Set<() => void>();
let analyticsPromise: Promise<Analytics | null> | null = null;
let lastTrackedPath: string | null = null;
let trackRequest = 0;

export function subscribeToAnalyticsConsent(onStoreChange: () => void): () => void {
  consentListeners.add(onStoreChange);
  return () => {
    consentListeners.delete(onStoreChange);
  };
}

/**
 * Tell subscribers the banner stored an accept. The cookie is already set.
 */
export function notifyAnalyticsConsent(): void {
  for (const listener of consentListeners) {
    listener();
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsentValue(ANALYTICS_CONSENT_COOKIE_NAME) === "true";
}

/**
 * Start Firebase Analytics once, and only in a browser that supports it.
 * Automatic page_view is off so client navigations are not counted twice.
 */
function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  analyticsPromise ??= startAnalytics().catch((error: unknown) => {
    logger.error("firebase analytics: initialization failed", error);
    return null;
  });

  return analyticsPromise;
}

async function startAnalytics(): Promise<Analytics | null> {
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID;
  if (!measurementId) {
    logger.debug("firebase analytics: measurement ID is not configured");
    return null;
  }

  const { getAnalytics, initializeAnalytics, isSupported } = await import(
    "firebase/analytics"
  );
  const supported = await isSupported();
  if (!supported) {
    logger.debug("firebase analytics: this browser does not support analytics");
    return null;
  }

  initializeAnalytics(app, {
    config: { send_page_view: false },
  });
  return getAnalytics(app);
}

/**
 * Log a page_view for a client route. No-ops until the cookie banner is accepted
 * and skips a repeated view of the same path.
 */
export async function trackPageView(
  pagePath: string,
  isCancelled: () => boolean = notCancelled,
): Promise<void> {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || pagePath.length === 0) {
    return;
  }
  if (pagePath === lastTrackedPath) {
    return;
  }

  const request = ++trackRequest;
  const analytics = await getFirebaseAnalytics();
  if (
    !analytics ||
    !hasAnalyticsConsent() ||
    isCancelled() ||
    request !== trackRequest ||
    pagePath === lastTrackedPath
  ) {
    return;
  }

  lastTrackedPath = pagePath;
  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, "page_view", {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
  });
}
