"use client";

import type { ReactNode } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { CLIENT_ID_TOKEN_COOKIE_NAME } from "@/constants/auth";

/**
 * Authentication provider that manages auth state synchronization and store initialization
 * Centralizes all authentication-related hooks and state management
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The auth provider with authentication context
 */
export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  useAuthSync(CLIENT_ID_TOKEN_COOKIE_NAME);
  useInitializeStores();

  return children;
};
