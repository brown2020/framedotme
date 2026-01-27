import { useCallback, useEffect, useRef, useMemo } from "react";
import { deleteCookie, setCookie } from "cookies-next";
import { getIdToken } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { debounce } from "@/utils/debounce";
import { 
  CLIENT_ID_TOKEN_COOKIE_NAME, 
  TOKEN_REFRESH_INTERVAL_MS, 
  TOKEN_REFRESH_DEBOUNCE_MS,
  getTokenRefreshKey
} from "@/constants/auth";
import { browserStorage } from "@/services/browserStorageService";

/**
 * Unified hook for all authentication synchronization concerns
 * Handles auth state tracking, token refresh, session cookies, and Firestore sync
 * 
 * Responsibilities:
 * 1. Sync Firebase Auth state to Zustand store
 * 2. Manage client and server session cookies
 * 3. Refresh auth tokens periodically
 * 4. Sync auth data to Firestore
 * 5. Handle cross-tab synchronization
 * 
 * @param cookieName - Name of the cookie to store the auth token
 */
export function useAuthSync(cookieName: string = CLIENT_ID_TOKEN_COOKIE_NAME) {
  if (!cookieName) {
    throw new Error("useAuthSync: cookieName is required");
  }

  const [user, loading, error] = useAuthState(auth);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUidRef = useRef<string>("");
  const lastTokenRefresh = getTokenRefreshKey(cookieName);

  // Session cookie management
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
      // Session cleanup is non-critical; user is already signed out locally
    }
  }, []);

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
      // Best-effort: if this fails, we still have the legacy (JS-readable) token cookie.
      await setServerSessionCookie(idTokenResult);

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

  // Effect 1: Sync Firebase auth state to Zustand and manage cookies
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
      // Fire-and-forget: best-effort cleanup of server-side session cookie
      void clearServerSessionCookie();
    }
  }, [clearServerSessionCookie, cookieName, loading, setAuthDetails, user]);

  // Effect 2: Sync auth data to Firestore when user changes
  useEffect(() => {
    const uid = user?.uid;
    const authReady = !loading;

    // Only sync if we have a UID and it's ready
    if (!uid || !authReady) {
      return;
    }

    // Skip if UID hasn't changed (already synced)
    if (previousUidRef.current === uid) {
      return;
    }

    previousUidRef.current = uid;

    // Fire-and-forget: sync to Firestore with explicit error handling
    const syncToFirestore = async () => {
      try {
        // Read fresh auth data from store at sync time
        const authData = {
          uid,
          authEmail: useAuthStore.getState().authEmail,
          authDisplayName: useAuthStore.getState().authDisplayName,
          authPhotoUrl: useAuthStore.getState().authPhotoUrl,
          authEmailVerified: useAuthStore.getState().authEmailVerified,
          authReady: useAuthStore.getState().authReady,
          authPending: useAuthStore.getState().authPending,
          isAdmin: useAuthStore.getState().isAdmin,
          isAllowed: useAuthStore.getState().isAllowed,
          isInvited: useAuthStore.getState().isInvited,
          lastSignIn: useAuthStore.getState().lastSignIn,
          premium: useAuthStore.getState().premium,
        };
        
        await updateUserDetailsInFirestore(authData, uid);
        logger.debug("Auth details synced to Firestore");
      } catch (error) {
        logger.error("Failed to sync auth details to Firestore", error);
      }
    };

    void syncToFirestore();
  }, [user?.uid, loading]);

  // Effect 3: Setup token refresh and cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      debouncedHandler(e, lastTokenRefresh, scheduleTokenRefresh);
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
      debouncedHandler.cancel();
    };
  }, [debouncedHandler, lastTokenRefresh, scheduleTokenRefresh, user?.uid]);

  return { uid: user?.uid, loading, error };
}
