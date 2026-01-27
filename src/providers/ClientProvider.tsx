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
