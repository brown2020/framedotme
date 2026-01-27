import { useCallback, useEffect } from "react";
import { deleteCookie } from "cookies-next";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { LEGACY_ID_TOKEN_COOKIE_NAME } from "@/constants/auth";
import { logger } from "@/utils/logger";
import { useTokenRefresh } from "./useTokenRefresh";

/**
 * Hook to manage Firebase authentication state and token synchronization
 * Handles user authentication state, session cookies, and automatic token refresh
 * 
 * @param cookieName - Name of the cookie to store the auth token (required)
 * @returns User authentication state (uid, loading, error)
 */
export const useAuthToken = (cookieName: string) => {
  if (!cookieName) {
    throw new Error("useAuthToken: cookieName is required");
  }
  const [user, loading, error] = useAuthState(auth);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);

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

  // Handle automatic token refresh
  useTokenRefresh(cookieName, user?.uid, setServerSessionCookie, clearServerSessionCookie);

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
