"use client";

import type { ReactNode } from "react";
import { useAuthStateSync } from "@/hooks/useAuthStateSync";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { useSyncAuthToFirestore } from "@/hooks/useSyncAuthToFirestore";

const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME;

if (!COOKIE_NAME) {
  throw new Error("NEXT_PUBLIC_COOKIE_NAME environment variable is required");
}

/**
 * Authentication provider that manages auth state synchronization and store initialization
 * Centralizes all authentication-related hooks and state management
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The auth provider with authentication context
 */
export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  useAuthStateSync(COOKIE_NAME);
  useInitializeStores();
  useSyncAuthToFirestore();

  return children;
};
