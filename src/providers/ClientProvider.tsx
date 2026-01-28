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
 * Provider composition order (outermost to innermost)
 * ⚠️ CRITICAL: Order enforced by validation below - do not modify without updating validation
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
