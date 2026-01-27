"use client";

import type { ReactNode } from "react";
import useAuthToken from "@/hooks/useAuthToken";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { useSyncAuthToFirestore } from "@/hooks/useSyncAuthToFirestore";

/**
 * Authentication provider that manages auth token, store initialization, and Firestore sync
 * Centralizes all authentication-related hooks and state management
 * Also provides loading state to child components via render props
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap (can be function or ReactNode)
 * @returns The auth provider with authentication context
 */
export const AuthProvider = ({ 
  children 
}: { 
  children: ReactNode | ((loading: boolean) => ReactNode);
}) => {
  const { loading } = useAuthToken(process.env.NEXT_PUBLIC_COOKIE_NAME!);
  useInitializeStores();
  useSyncAuthToFirestore();

  return <>{typeof children === 'function' ? children(loading) : children}</>;
};
