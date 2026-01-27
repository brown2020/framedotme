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

  const handleStorageChange = useMemo(
    () =>
      debounce((e: StorageEvent) => {
        if (e.key === lastTokenRefresh) {
          scheduleTokenRefresh();
        }
      }, TOKEN_REFRESH_DEBOUNCE_MS),
    [lastTokenRefresh, scheduleTokenRefresh]
  );

  useEffect(() => {
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
      handleStorageChange.cancel();
    };
  }, [handleStorageChange, scheduleTokenRefresh, user?.uid]);

  useEffect(() => {
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
      clearAuthDetails();
      deleteCookie(cookieName);
      // Best-effort cleanup of server-side session cookie
      void clearServerSessionCookie();
    }
  }, [clearAuthDetails, clearServerSessionCookie, cookieName, setAuthDetails, user]);

  return { uid: user?.uid, loading, error };
};

export default useAuthToken;
