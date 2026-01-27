import { useCallback, useEffect, useMemo, useRef } from "react";
import { getIdToken } from "firebase/auth";
import { deleteCookie, setCookie } from "cookies-next";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { 
  LEGACY_ID_TOKEN_COOKIE_NAME, 
  TOKEN_REFRESH_INTERVAL_MS, 
  TOKEN_REFRESH_DEBOUNCE_MS 
} from "@/lib/constants";
import { browserStorage, AUTH_STORAGE_KEYS } from "@/services/browserStorageService";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { debounce } from "@/utils/debounce";

const useAuthToken = (cookieName = LEGACY_ID_TOKEN_COOKIE_NAME) => {
  const [user, loading, error] = useAuthState(auth);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);

  const lastTokenRefresh = AUTH_STORAGE_KEYS.TOKEN_REFRESH(cookieName);

  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setServerSessionCookie = useCallback(async (idToken: string) => {
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (error: unknown) {
      logger.error("Failed to set session cookie", error);
    }
  }, []);

  const clearServerSessionCookie = useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // ignore
    }
  }, []);

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
    if (user?.uid) {
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
  }, [lastTokenRefresh, scheduleTokenRefresh, user?.uid]);

  useEffect(() => {
    // Don't do anything until Firebase auth state is determined
    if (loading) {
      return;
    }

    if (user?.uid) {
      setAuthDetails({
        uid: user.uid,
        authEmail: user.email || "",
        authDisplayName: user.displayName || "",
        authPhotoUrl: user.photoURL || "",
        authEmailVerified: user.emailVerified || false,
        authReady: true,
        authPending: false,
      });
    } else {
      // Clear auth but mark as ready (we've confirmed there's no user)
      setAuthDetails({
        uid: "",
        authEmail: "",
        authDisplayName: "",
        authPhotoUrl: "",
        authEmailVerified: false,
        authReady: true,
        authPending: false,
        isAdmin: false,
        isAllowed: false,
        isInvited: false,
        lastSignIn: null,
        premium: false,
      });
      deleteCookie(cookieName);
      // Best-effort cleanup of server-side session cookie
      void clearServerSessionCookie();
    }
  }, [clearServerSessionCookie, cookieName, loading, setAuthDetails, user]);

  return { uid: user?.uid, loading, error };
};

export default useAuthToken;
