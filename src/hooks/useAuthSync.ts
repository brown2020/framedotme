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

import { useEffect, useRef } from "react";
import { deleteCookie } from "cookies-next";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";

import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";
import {
  CLIENT_ID_TOKEN_COOKIE_NAME,
  SESSION_REFRESH_INTERVAL_MS,
} from "@/constants/auth";
import {
  clearServerSessionCookie,
  setServerSessionCookie,
} from "@/services/sessionCookieService";

/**
 * Create server session cookie from Firebase ID token
 * This session cookie is what the proxy validates
 */
async function createSessionCookie(idToken: string): Promise<boolean> {
  try {
    await setServerSessionCookie(idToken);
    return true;
  } catch (error) {
    logger.error("Session cookie request failed", error);
    return false;
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
          // Get ID token
          const idToken = await getIdToken(user, true);

          // Check if this operation is still valid (no new auth changes)
          if (currentVersion !== sessionVersionRef.current) {
            return;
          }

          // Drop any legacy JS-readable ID token cookie. The HttpOnly session is enough.
          deleteCookie(cookieName);

          // Create server session cookie (THIS IS CRITICAL - proxy validates this)
          const sessionCreated = await createSessionCookie(idToken);

          // Check again after async operation
          if (currentVersion !== sessionVersionRef.current) {
            return;
          }

          if (sessionCreated) {
            // Only mark as ready AFTER session cookie is created
            setAuthDetails({
              uid: user.uid,
              authEmail: user.email || "",
              authDisplayName:
                user.displayName || useAuthStore.getState().authDisplayName || "",
              authPhotoUrl: user.photoURL || "",
              authEmailVerified: user.emailVerified || false,
              authReady: true, // Session is ready!
              authPending: false,
              sessionError: null,
            });
          } else {
            logger.error("Failed to create session cookie");
            setAuthDetails({
              uid: user.uid,
              authEmail: user.email || "",
              authDisplayName:
                user.displayName || useAuthStore.getState().authDisplayName || "",
              authPhotoUrl: user.photoURL || "",
              authEmailVerified: user.emailVerified || false,
              authReady: false,
              authPending: false,
              sessionError:
                "Could not start a secure session. Check your connection and try again.",
            });
          }
        } catch (error) {
          // Only update state if this version is still current
          if (currentVersion !== sessionVersionRef.current) {
            return;
          }

          logger.error("Session setup error", error);

          setAuthDetails({
            uid: user.uid,
            authEmail: user.email || "",
            authDisplayName:
              user.displayName || useAuthStore.getState().authDisplayName || "",
            authPhotoUrl: user.photoURL || "",
            authEmailVerified: user.emailVerified || false,
            authReady: false,
            authPending: false,
            sessionError:
              "Could not start a secure session. Check your connection and try again.",
          });
        }
      };

      void setupUserSession();
    } else {
      // No user: clear everything and mark ready

      setAuthDetails({
        uid: "",
        authEmail: "",
        authDisplayName: "",
        authPhotoUrl: "",
        authEmailVerified: false,
        authReady: true, // Ready because we confirmed no user
        authPending: false,
        sessionError: null,
        isAdmin: false,
        isAllowed: false,
        isInvited: false,
        lastSignIn: null,
        premium: false,
      });

      deleteCookie(cookieName);
      void clearServerSessionCookie();
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
        // Privilege flags stay off this payload so a client login cannot clear them.
        const authData = {
          uid,
          authEmail: currentState.authEmail,
          authDisplayName: currentState.authDisplayName,
          authPhotoUrl: currentState.authPhotoUrl,
          authEmailVerified: currentState.authEmailVerified,
        };

        await updateUserDetailsInFirestore(authData, uid);
        logger.debug("Auth details synced to Firestore");
      } catch (error) {
        logger.error("Failed to sync auth details to Firestore", error);
      }
    };

    void syncToFirestore();
  }, [user?.uid, loading]);

  // Rotate the short-lived server session while the tab stays open.
  useEffect(() => {
    if (loading || !user) return;
    const refresh = async () => {
      try {
        const idToken = await getIdToken(user, true);
        await setServerSessionCookie(idToken);
      } catch (refreshError) {
        logger.warn("Session refresh failed", refreshError);
      }
    };
    const intervalId = window.setInterval(() => {
      void refresh();
    }, SESSION_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loading, user]);

  return { uid: user?.uid, loading, error };
}
