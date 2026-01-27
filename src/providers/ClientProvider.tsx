"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import CookieConsent from "react-cookie-consent";

import { useAuthStore } from "@/zustand/useAuthStore";
import { RecorderStatusProvider } from "./RecorderStatusProvider";
import { ViewportProvider } from "./ViewportProvider";
import { AuthProvider } from "./AuthProvider";
import { RouteGuardProvider } from "./RouteGuardProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { isReactNativeWebView } from "@/utils/platform";

/**
 * Client provider component that composes all necessary providers
 * Provides authentication, viewport management, route guards, and global UI elements
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The client provider with all app-level context providers
 */
export function ClientProvider({ children }: { children: ReactNode }) {
  const uid = useAuthStore((state) => state.uid);

  // Only wrap children with RecorderStatusProvider when user is authenticated
  const wrappedChildren = uid ? (
    <RecorderStatusProvider>{children}</RecorderStatusProvider>
  ) : (
    children
  );

  return (
    <ErrorBoundary>
      <ViewportProvider>
        <AuthProvider>
          <RouteGuardProvider>
            <div className="flex flex-col h-full">
              {wrappedChildren}
              {!isReactNativeWebView() && (
                <CookieConsent>
                  This app uses cookies to enhance the user experience.
                </CookieConsent>
              )}
              <Toaster position="bottom-center" />
            </div>
          </RouteGuardProvider>
        </AuthProvider>
      </ViewportProvider>
    </ErrorBoundary>
  );
}
