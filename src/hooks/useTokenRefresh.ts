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
  TOKEN_REFRESH_KEY_PREFIX,
} from "@/constants/auth";
import { browserStorage } from "@/services/browserStorageService";
import { getTabLeader } from "@/utils/tabLeaderElection";

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
  isAuthenticated: boolean,
) {
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTokenRefresh = `${TOKEN_REFRESH_KEY_PREFIX}${cookieName}`;

  // Tab leader election - only leader tab performs token refresh
  const tabLeaderRef = useRef(getTabLeader(`token-refresh-${cookieName}`));

  // Token refresh logic - only executes if this tab is the leader
  const refreshAuthToken = useCallback(async (force = false) => {
    // Only leader tab should perform token refresh to prevent race conditions
    // across multiple tabs. Force bypasses leader check for initial setup.
    if (!force && !tabLeaderRef.current.isLeader()) {
      console.log("[useTokenRefresh] Not leader tab, skipping refresh");
      return;
    }

    try {
      if (!auth.currentUser) {
        console.error("[useTokenRefresh] No user found during token refresh");
        throw new Error("No user found");
      }

      console.log(
        "[useTokenRefresh] Getting ID token for user:",
        auth.currentUser.uid,
      );
      const idTokenResult = await getIdToken(auth.currentUser, true);
      console.log(
        "[useTokenRefresh] Got ID token, length:",
        idTokenResult.length,
      );

      console.log("[useTokenRefresh] Setting cookie:", cookieName);
      setCookie(cookieName, idTokenResult, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Verify cookie was set
      const cookieCheck = document.cookie.includes(cookieName);
      console.log("[useTokenRefresh] Cookie set verification:", cookieCheck);
      if (!cookieCheck) {
        console.error(
          "[useTokenRefresh] Cookie was NOT set! All cookies:",
          document.cookie,
        );
      }

      // Upgrade to a secure httpOnly session cookie for server-side route protection.
      // Treat as transaction: if session cookie fails, rollback client cookie
      try {
        console.log("[useTokenRefresh] Setting server session cookie");
        await setServerSessionCookie(idTokenResult);
        console.log("[useTokenRefresh] Server session cookie set successfully");
      } catch (sessionError) {
        console.error(
          "[useTokenRefresh] Failed to set server session cookie:",
          sessionError,
        );
        deleteCookie(cookieName);
        throw new Error("Failed to set session cookie", {
          cause: sessionError,
        });
      }

      if (!isReactNativeWebView()) {
        browserStorage.setItem(lastTokenRefresh, Date.now().toString());
        // Broadcast to other tabs that token was refreshed
        tabLeaderRef.current.broadcast("token-refreshed");
      }

      console.log("[useTokenRefresh] ✅ Token refresh complete");
    } catch (error: unknown) {
      console.error("[useTokenRefresh] ❌ Error refreshing token:", error);
      logger.error("Error refreshing token", error);
      deleteCookie(cookieName);
      // Fire-and-forget: best-effort cleanup of server-side session cookie
      void clearServerSessionCookie();
    }
  }, [
    clearServerSessionCookie,
    cookieName,
    lastTokenRefresh,
    setServerSessionCookie,
  ]);

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
    () =>
      debounce(
        (e: StorageEvent, tokenRefreshKey: string, refresh: () => void) => {
          if (e.key === tokenRefreshKey) {
            refresh();
          }
        },
        TOKEN_REFRESH_DEBOUNCE_MS,
      ),
    [], // Empty deps: handler is parameterized, no closure over changing values
  );

  // Setup token refresh and cross-tab sync
  useEffect(() => {
    const tabLeader = tabLeaderRef.current;

    const handleStorageChange = (e: StorageEvent) => {
      debouncedHandler(e, lastTokenRefresh, scheduleTokenRefresh);
    };

    if (!isReactNativeWebView()) {
      window.addEventListener("storage", handleStorageChange);
    }

    // Listen for token refresh broadcasts from leader tab
    const unsubscribeBroadcast = tabLeader.onBroadcast((message) => {
      if (message === "token-refreshed") {
        console.log("[useTokenRefresh] Received token-refreshed broadcast from leader");
        // Reschedule our local refresh timer since leader just refreshed
        scheduleTokenRefresh();
      }
    });

    // Immediately refresh token if user is authenticated and cookie doesn't exist
    // This ensures the cookie is set right after sign-in
    if (isAuthenticated) {
      const checkAndSetCookie = async () => {
        // Check if cookie already exists (simple heuristic: check if we refreshed recently)
        const lastRefresh = browserStorage.getItem(lastTokenRefresh);
        const now = Date.now();
        const timeSinceLastRefresh = lastRefresh
          ? now - parseInt(lastRefresh, 10)
          : Infinity;

        // If no recent refresh (> 1 minute ago), try to become leader and refresh
        if (timeSinceLastRefresh > 60000) {
          // Try to become leader for initial refresh
          if (tabLeader.tryBecomeLeader()) {
            await refreshAuthToken(true); // Force refresh as we just became leader
          } else {
            // Not leader, but still need initial cookie - force refresh once
            console.log("[useTokenRefresh] Not leader, but forcing initial token refresh");
            await refreshAuthToken(true);
          }
        }

        // Then schedule periodic refresh (only leader will actually execute)
        scheduleTokenRefresh();
      };

      void checkAndSetCookie();
    }

    return () => {
      if (typeof window !== "undefined" && !isReactNativeWebView()) {
        window.removeEventListener("storage", handleStorageChange);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
      debouncedHandler.cancel();
      unsubscribeBroadcast();
    };
  }, [
    debouncedHandler,
    lastTokenRefresh,
    scheduleTokenRefresh,
    isAuthenticated,
    refreshAuthToken,
  ]);
}
