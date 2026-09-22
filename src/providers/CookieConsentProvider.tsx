"use client";

import type { ReactNode } from "react";
import CookieConsent from "react-cookie-consent";

/**
 * Cookie consent banner for the web app.
 * Always rendered the same on server and client to avoid hydration mismatch.
 * Named region landmark satisfies axe `region` for the banner content.
 */
export function CookieConsentProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <CookieConsent
        ariaAcceptLabel="Accept cookies"
        customContainerAttributes={{
          role: "region",
          "aria-label": "Cookie consent",
        }}
      >
        This app uses cookies to enhance the user experience.
      </CookieConsent>
    </>
  );
}
