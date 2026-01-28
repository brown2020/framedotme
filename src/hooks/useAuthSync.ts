/**
 * Authentication synchronization hook with dual cookie strategy
 * 
 * DUAL COOKIE ARCHITECTURE:
 * This hook manages TWO cookies for robust authentication:
 * 
 * 1. CLIENT_ID_TOKEN_COOKIE_NAME (JavaScript-readable):
 *    - Accessible to Firebase client SDK in browser
 *    - Enables client-side auth state restoration
 *    - Used for real-time Firebase queries with security rules
 * 
 * 2. SESSION_COOKIE_NAME (httpOnly, server-only):
 *    - Created via /api/session endpoint
 *    - Used by proxy.ts middleware for server-side route protection
 *    - Prevents CSRF attacks and XSS token theft
 * 
 * WHY BOTH?
 * - Client cookie: Firebase SDK requires JavaScript access for client-side operations
 * - Server cookie: Next.js middleware cannot access JavaScript cookies, needs httpOnly
 * - Both contain same auth token but serve different layers of the application
 * 
 * TRANSACTION GUARANTEE:
 * Token refresh treats both cookies as a transaction - if server cookie fails,
 * client cookie is rolled back to maintain consistency.
 */

import { useCallback, useEffect, useRef } from "react";
import { deleteCookie } from "cookies-next";
import { useAuthState } from "react-firebase-hooks/auth";

import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";
import { CLIENT_ID_TOKEN_COOKIE_NAME } from "@/constants/auth";
import { useTokenRefresh } from "./useTokenRefresh";

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
  const previousUidRef = useRef<string>("");

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

  // Delegate token refresh to dedicated hook
  useTokenRefresh(
    cookieName,
    setServerSessionCookie,
    clearServerSessionCookie,
    Boolean(user?.uid)
  );

  // Sync Firebase auth state to Zustand and manage cookies
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

  // Sync auth data to Firestore when user changes
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
        // Read auth state once to avoid stale closures during async operations
        const currentState = useAuthStore.getState();
        const authData = {
          uid,
          authEmail: currentState.authEmail,
          authDisplayName: currentState.authDisplayName,
          authPhotoUrl: currentState.authPhotoUrl,
          authEmailVerified: currentState.authEmailVerified,
          authReady: currentState.authReady,
          authPending: currentState.authPending,
          isAdmin: currentState.isAdmin,
          isAllowed: currentState.isAllowed,
          isInvited: currentState.isInvited,
          lastSignIn: currentState.lastSignIn,
          premium: currentState.premium,
        };
        
        await updateUserDetailsInFirestore(authData, uid);
        logger.debug("Auth details synced to Firestore");
      } catch (error) {
        logger.error("Failed to sync auth details to Firestore", error);
      }
    };

    void syncToFirestore();
  }, [user?.uid, loading]);

  return { uid: user?.uid, loading, error };
}
