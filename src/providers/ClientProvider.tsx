"use client";

import type { ReactNode } from "react";
import { RecorderStatusProvider } from "./RecorderStatusProvider";
import { ViewportProvider } from "./ViewportProvider";
import { AuthProvider } from "./AuthProvider";
import { RouteGuardProvider } from "./RouteGuardProvider";
import { ToasterProvider } from "./ToasterProvider";
import { CookieConsentProvider } from "./CookieConsentProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Client provider component that composes all necessary providers
 * Provides authentication, viewport management, route guards, and global UI elements
 * 
 * Provider Order and Dependencies (outermost to innermost):
 * 1. ErrorBoundary - Must wrap everything to catch errors from any provider
 * 2. ViewportProvider - No dependencies, provides viewport state
 * 3. AuthProvider - No dependencies, initializes auth state
 * 4. RouteGuardProvider - Depends on AuthProvider for authReady state
 * 5. RecorderStatusProvider - Depends on AuthProvider for user ID
 * 6. ToasterProvider - No dependencies, provides toast notifications
 * 7. CookieConsentProvider - Innermost, shows cookie consent banner
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The client provider with all app-level context providers
 */
export function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ViewportProvider>
        <AuthProvider>
          <RouteGuardProvider>
            <RecorderStatusProvider>
              <ToasterProvider>
                <CookieConsentProvider>
                  <div className="flex flex-col h-full">{children}</div>
                </CookieConsentProvider>
              </ToasterProvider>
            </RecorderStatusProvider>
          </RouteGuardProvider>
        </AuthProvider>
      </ViewportProvider>
    </ErrorBoundary>
  );
}
