"use client";

import type { ReactNode } from "react";
import { ProviderComposer } from "./ProviderComposer";
import { RecorderStatusProvider } from "./RecorderStatusProvider";
import { ViewportProvider } from "./ViewportProvider";
import { AuthProvider } from "./AuthProvider";
import { RouteGuardProvider } from "./RouteGuardProvider";
import { ToasterProvider } from "./ToasterProvider";
import { CookieConsentProvider } from "./CookieConsentProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * Provider order configuration (outermost to innermost)
 * 
 * ⚠️ CRITICAL: Order matters! Dependencies flow from outer to inner providers.
 * Changing this order WILL break the application.
 * 
 * Dependency Graph:
 * 1. ErrorBoundary - Must wrap everything to catch errors from any provider
 * 2. ViewportProvider - No dependencies, provides viewport state
 * 3. AuthProvider - No dependencies, initializes auth state
 * 4. RouteGuardProvider - DEPENDS ON: AuthProvider (reads authReady state)
 * 5. RecorderStatusProvider - DEPENDS ON: AuthProvider (reads user ID)
 * 6. ToasterProvider - No dependencies, provides toast notifications
 * 7. CookieConsentProvider - Innermost, shows cookie consent banner
 * 
 * To add a new provider:
 * 1. Identify which providers it depends on (must come AFTER those)
 * 2. Identify which providers depend on it (must come BEFORE those)
 * 3. Insert in the correct position based on dependency order
 * 4. Update this documentation with the new provider's dependencies
 */
const PROVIDER_ORDER = [
  { component: ErrorBoundary },
  { component: ViewportProvider },
  { component: AuthProvider },
  { component: RouteGuardProvider },
  { component: RecorderStatusProvider },
  { component: ToasterProvider },
  { component: CookieConsentProvider },
] as const;

// Development-time validation to ensure provider array hasn't been accidentally modified
if (process.env.NODE_ENV === 'development') {
  const expectedProviders = [
    'ErrorBoundary',
    'ViewportProvider', 
    'AuthProvider',
    'RouteGuardProvider',
    'RecorderStatusProvider',
    'ToasterProvider',
    'CookieConsentProvider',
  ];
  
  const actualProviders = PROVIDER_ORDER.map(p => p.component.name);
  const isCorrectOrder = expectedProviders.every((name, i) => actualProviders[i] === name);
  
  if (!isCorrectOrder) {
    console.error('Provider order validation failed!');
    console.error('Expected:', expectedProviders);
    console.error('Actual:', actualProviders);
    throw new Error(
      'Provider order has been modified. This will break dependency chain. ' +
      'See ClientProvider.tsx documentation for correct order.'
    );
  }
}

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
    <ProviderComposer providers={PROVIDER_ORDER}>
      {children}
    </ProviderComposer>
  );
}
