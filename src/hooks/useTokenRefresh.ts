import { useCallback, useEffect, useRef, useMemo } from "react";
import { deleteCookie, setCookie } from "cookies-next";
import { getIdToken } from "firebase/auth";

import { auth } from "@/firebase/firebaseClient";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { debounce } from "@/utils/debounce";
import { 
  TOKEN_REFRESH_INTERVAL_MS, 
  TOKEN_REFRESH_DEBOUNCE_MS,
  getTokenRefreshKey
} from "@/constants/auth";
import { browserStorage } from "@/services/browserStorageService";

/**
 * Hook for managing token refresh and session cookie synchronization
 * 
 * Handles periodic token refresh (every 50 minutes), cross-tab synchronization,
 * and transaction-safe cookie updates for both client and server cookies.
 * 
 * See src/lib/auth/README.md for complete dual-cookie architecture documentation.
 * 
 * @param cookieName - Name of the client cookie to store the auth token
 * @param setServerSessionCookie - Function to set the server-side httpOnly session cookie
 * @param clearServerSessionCookie - Function to clear the server-side session cookie
 * @param isAuthenticated - Whether user is currently authenticated
 */
export function useTokenRefresh(
  cookieName: string,
  setServerSessionCookie: (token: string) => Promise<void>,
  clearServerSessionCookie: () => Promise<void>,
  isAuthenticated: boolean
) {
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTokenRefresh = getTokenRefreshKey(cookieName);

  // Token refresh logic
  const refreshAuthToken = useCallback(async () => {
    try {
      if (!auth.currentUser) throw new Error("No user found");
      const idTokenResult = await getIdToken(auth.currentUser, true);

      setCookie(cookieName, idTokenResult, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Upgrade to a secure httpOnly session cookie for server-side route protection.
      // Treat as transaction: if session cookie fails, rollback client cookie
      try {
        await setServerSessionCookie(idTokenResult);
      } catch (sessionError) {
        deleteCookie(cookieName);
        throw new Error("Failed to set session cookie", { cause: sessionError });
      }

      if (!isReactNativeWebView()) {
        browserStorage.setItem(lastTokenRefresh, Date.now().toString());
      }
    } catch (error: unknown) {
      logger.error("Error refreshing token", error);
      deleteCookie(cookieName);
      // Fire-and-forget: best-effort cleanup of server-side session cookie
      void clearServerSessionCookie();
    }
  }, [clearServerSessionCookie, cookieName, lastTokenRefresh, setServerSessionCookie]);

  const scheduleTokenRefresh = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    const timeoutId = setTimeout(refreshAuthToken, TOKEN_REFRESH_INTERVAL_MS);
    activityTimeoutRef.current = timeoutId;
  }, [refreshAuthToken]);

  // Create stable debounced handler for cross-tab synchronization
  // useMemo ensures handler is created once and reused across renders
  const debouncedHandler = useMemo(
    () => debounce((e: StorageEvent, tokenRefreshKey: string, refresh: () => void) => {
      if (e.key === tokenRefreshKey) {
        refresh();
      }
    }, TOKEN_REFRESH_DEBOUNCE_MS),
    [] // Empty deps: handler is parameterized, no closure over changing values
  );

  // Setup token refresh and cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      debouncedHandler(e, lastTokenRefresh, scheduleTokenRefresh);
    };

    if (!isReactNativeWebView()) {
      window.addEventListener("storage", handleStorageChange);
    }

    // Schedule initial token refresh if user is authenticated
    if (isAuthenticated) {
      scheduleTokenRefresh();
    }

    return () => {
      if (typeof window !== 'undefined' && !isReactNativeWebView()) {
        window.removeEventListener("storage", handleStorageChange);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
      debouncedHandler.cancel();
    };
  }, [debouncedHandler, lastTokenRefresh, scheduleTokenRefresh, isAuthenticated]);
}
