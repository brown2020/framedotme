"use client";

import type { ReactNode } from "react";
import CookieConsent from "react-cookie-consent";

/**
 * Cookie consent banner for the web app.
 * Always rendered the same on server and client to avoid hydration mismatch.
 * React Native WebView hosts should suppress this UI at the host layer.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <CookieConsent>
        This app uses cookies to enhance the user experience.
      </CookieConsent>
    </>
  );
}
