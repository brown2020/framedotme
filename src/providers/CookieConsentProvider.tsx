"use client";

import type { ReactNode } from "react";
import CookieConsent from "react-cookie-consent";
import { isReactNativeWebView } from "@/utils/platform";

/**
 * Provider that renders the cookie consent banner
 * Hidden in React Native WebView environments
 * Separated for better separation of concerns
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The cookie consent provider with optional banner
 */
export function CookieConsentProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      {!isReactNativeWebView() && (
        <CookieConsent>
          This app uses cookies to enhance the user experience.
        </CookieConsent>
      )}
    </>
  );
}
