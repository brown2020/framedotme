import { useCallback, useEffect, useRef } from "react";
import { getIdToken } from "firebase/auth";
import { deleteCookie, setCookie } from "cookies-next";
import { auth } from "@/firebase/firebaseClient";
import { 
  LEGACY_ID_TOKEN_COOKIE_NAME, 
  TOKEN_REFRESH_INTERVAL_MS, 
  TOKEN_REFRESH_DEBOUNCE_MS 
} from "@/constants/auth";
import { browserStorage, AUTH_STORAGE_KEYS } from "@/services/browserStorageService";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { debounce } from "@/utils/debounce";

/**
 * Hook to manage automatic token refresh and session cookie synchronization
 * Handles periodic token refresh, cross-tab synchronization, and session cookie management
 * 
 * @param cookieName - Name of the cookie to store the auth token
 * @param uid - The authenticated user's unique identifier
 * @param setServerSessionCookie - Function to set the server-side session cookie
 * @param clearServerSessionCookie - Function to clear the server-side session cookie
 */
export const useTokenRefresh = (
  cookieName: string = LEGACY_ID_TOKEN_COOKIE_NAME,
  uid: string | undefined,
  setServerSessionCookie: (idToken: string) => Promise<void>,
  clearServerSessionCookie: () => Promise<void>
) => {
  const lastTokenRefresh = AUTH_STORAGE_KEYS.TOKEN_REFRESH(cookieName);
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshAuthToken = useCallback(async () => {
    try {
      if (!auth.currentUser) throw new Error("No user found");
      const idTokenResult = await getIdToken(auth.currentUser, true);

      setCookie(cookieName, idTokenResult, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Upgrade to a secure httpOnly session cookie for server-side route protection.
      // Best-effort: if this fails, we still have the legacy (JS-readable) token cookie.
      await setServerSessionCookie(idTokenResult);

      if (!isReactNativeWebView()) {
        browserStorage.setItem(lastTokenRefresh, Date.now().toString());
      }
    } catch (error: unknown) {
      logger.error("Error refreshing token", error);
      deleteCookie(cookieName);

      // Best-effort cleanup of server-side session cookie
      await clearServerSessionCookie();
    }
  }, [clearServerSessionCookie, cookieName, lastTokenRefresh, setServerSessionCookie]);

  const scheduleTokenRefresh = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (document.visibilityState === "visible") {
      const timeoutId = setTimeout(refreshAuthToken, TOKEN_REFRESH_INTERVAL_MS);
      activityTimeoutRef.current = timeoutId;
    }
  }, [refreshAuthToken]);

  // Create debounced handler once and store in ref
  const debouncedHandlerRef = useRef(
    debounce((e: StorageEvent, tokenRefreshKey: string, refresh: () => void) => {
      if (e.key === tokenRefreshKey) {
        refresh();
      }
    }, TOKEN_REFRESH_DEBOUNCE_MS)
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      debouncedHandlerRef.current(e, lastTokenRefresh, scheduleTokenRefresh);
    };

    if (!isReactNativeWebView()) {
      window.addEventListener("storage", handleStorageChange);
    }

    // Schedule initial token refresh if user is authenticated
    if (uid) {
      scheduleTokenRefresh();
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
      debouncedHandlerRef.current.cancel();
    };
  }, [lastTokenRefresh, scheduleTokenRefresh, uid]);

  return {
    refreshAuthToken,
    scheduleTokenRefresh,
  };
};
