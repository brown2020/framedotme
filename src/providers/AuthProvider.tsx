"use client";

import type { ReactNode } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { useSyncAuthToFirestore } from "@/hooks/useSyncAuthToFirestore";

const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME;

if (!COOKIE_NAME) {
  throw new Error("NEXT_PUBLIC_COOKIE_NAME environment variable is required");
}

/**
 * Authentication provider that manages auth token, store initialization, and Firestore sync
 * Centralizes all authentication-related hooks and state management
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The auth provider with authentication context
 */
export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  useAuthToken(COOKIE_NAME);
  useInitializeStores();
  useSyncAuthToFirestore();

  return children;
};
