"use client";

import type { ReactNode } from "react";
import CookieConsent from "react-cookie-consent";

import { useAnalyticsPageViews } from "@/hooks/useAnalyticsPageViews";
import {
  ANALYTICS_CONSENT_COOKIE_NAME,
  notifyAnalyticsConsent,
} from "@/services/analyticsService";

/**
 * Cookie consent banner for the web app.
 * Always rendered the same on server and client to avoid hydration mismatch.
 * Firebase Analytics starts only after this banner is accepted.
 * Named region landmark satisfies axe `region` for the banner content.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }): ReactNode {
  useAnalyticsPageViews();

  return (
    <>
      {children}
      <CookieConsent
        ariaAcceptLabel="Accept cookies"
        cookieName={ANALYTICS_CONSENT_COOKIE_NAME}
        customContainerAttributes={{
          role: "region",
          "aria-label": "Cookie consent",
        }}
        onAccept={notifyAnalyticsConsent}
      >
        This app uses cookies to enhance the user experience.
      </CookieConsent>
    </>
  );
}
