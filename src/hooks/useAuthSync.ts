/**
 * Authentication synchronization hook with session-based strategy
 *
 * This hook manages authentication state synchronization:
 * - Firebase Auth SDK (client-side)
 * - Server session JWT (HTTP-only cookie for proxy validation)
 * - Zustand store (application state)
 * - Firestore (user data persistence)
 *
 * CRITICAL: authReady is only set AFTER session cookie is confirmed created
 * This prevents race conditions where users can't access protected routes
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { deleteCookie, setCookie } from "cookies-next";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";

import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";
import { CLIENT_ID_TOKEN_COOKIE_NAME } from "@/constants/auth";
import { getClientCsrfToken, CSRF_HEADER_NAME } from "@/lib/security/csrf";

/**
 * Create server session cookie from Firebase ID token
 * This session cookie is what the proxy validates
 */
async function createSessionCookie(idToken: string): Promise<boolean> {
  try {
    // Include CSRF token if available (for token refresh, not initial login)
    const csrfToken = getClientCsrfToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    const response = await fetch("/api/session", {
      method: "POST",
      headers,
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      console.error(
        "[createSessionCookie] API returned error:",
        response.status,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[createSessionCookie] Request failed:", error);
    return false;
  }
}

/**
 * Clear server session cookie
 */
async function clearSessionCookie(): Promise<void> {
  try {
    // Include CSRF token for DELETE request
    const csrfToken = getClientCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    await fetch("/api/session", {
      method: "DELETE",
      headers,
    });
  } catch (error) {
    // Best-effort cleanup, don't block on failure
    logger.error("Failed to clear session cookie", error);
  }
}

/**
 * Unified hook for authentication synchronization
 *
 * @param cookieName - Name of the client cookie for Firebase token
 */
export function useAuthSync(cookieName: string = CLIENT_ID_TOKEN_COOKIE_NAME) {
  if (!cookieName) {
    throw new Error("useAuthSync: cookieName is required");
  }

  const [user, loading, error] = useAuthState(auth);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const previousUidRef = useRef<string>("");

  // Version counter to invalidate stale async operations
  // This prevents race conditions when auth state changes rapidly
  const sessionVersionRef = useRef(0);

  // Setup session when user signs in
  useEffect(() => {
    // Wait for Firebase auth to load
    if (loading) {
      return;
    }

    // Increment version to invalidate any in-flight operations
    const currentVersion = ++sessionVersionRef.current;

    // User signed in
    if (user?.uid) {
      const setupUserSession = async () => {
        try {
          console.log("[useAuthSync] Setting up session for user:", user.uid, "version:", currentVersion);

          // Get ID token
          const idToken = await getIdToken(user, true);

          // Check if this operation is still valid (no new auth changes)
          if (currentVersion !== sessionVersionRef.current) {
            console.log("[useAuthSync] Stale session setup, aborting (expected:", sessionVersionRef.current, "got:", currentVersion, ")");
            return;
          }

          // Set client cookie for Firebase SDK
          setCookie(cookieName, idToken, {
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });

          // Create server session cookie (THIS IS CRITICAL - proxy validates this)
          const sessionCreated = await createSessionCookie(idToken);

          // Check again after async operation
          if (currentVersion !== sessionVersionRef.current) {
            console.log("[useAuthSync] Stale session after cookie creation, aborting");
            return;
          }

          if (sessionCreated) {
            console.log(
              "[useAuthSync] ✅ Session ready, setting authReady=true",
            );

            // Only mark as ready AFTER session cookie is created
            setAuthDetails({
              uid: user.uid,
              authEmail: user.email || "",
              authDisplayName: user.displayName || "",
              authPhotoUrl: user.photoURL || "",
              authEmailVerified: user.emailVerified || false,
              authReady: true, // Session is ready!
              authPending: false,
            });
          } else {
            console.error(
              "[useAuthSync] ❌ Failed to create session, keeping authReady=false",
            );

            // Session failed - keep pending
            setAuthDetails({
              uid: user.uid,
              authEmail: user.email || "",
              authDisplayName: user.displayName || "",
              authPhotoUrl: user.photoURL || "",
              authEmailVerified: user.emailVerified || false,
              authReady: false, // NOT ready because session creation failed
              authPending: true,
            });
          }
        } catch (error) {
          // Only update state if this version is still current
          if (currentVersion !== sessionVersionRef.current) {
            console.log("[useAuthSync] Stale error handler, ignoring");
            return;
          }

          console.error("[useAuthSync] Session setup error:", error);
          logger.error("Session setup error", error);

          setAuthDetails({
            uid: user.uid,
            authEmail: user.email || "",
            authDisplayName: user.displayName || "",
            authPhotoUrl: user.photoURL || "",
            authEmailVerified: user.emailVerified || false,
            authReady: false,
            authPending: true,
          });
        }
      };

      void setupUserSession();
    } else {
      // No user: clear everything and mark ready
      console.log("[useAuthSync] No user, clearing session");

      setAuthDetails({
        uid: "",
        authEmail: "",
        authDisplayName: "",
        authPhotoUrl: "",
        authEmailVerified: false,
        authReady: true, // Ready because we confirmed no user
        authPending: false,
        isAdmin: false,
        isAllowed: false,
        isInvited: false,
        lastSignIn: null,
        premium: false,
      });

      deleteCookie(cookieName);
      void clearSessionCookie();
    }
  }, [cookieName, loading, setAuthDetails, user]);

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
