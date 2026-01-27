import { useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";

/**
 * Hook to sync auth state changes to Firestore
 * Handles the side effect of persisting auth details separately from state management
 * Optimized to only trigger on actual auth state changes, not action updates
 */
export function useSyncAuthToFirestore(): void {
  // Use specific selectors instead of entire store to prevent unnecessary re-renders
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const authEmail = useAuthStore((state) => state.authEmail);
  const authDisplayName = useAuthStore((state) => state.authDisplayName);
  const authPhotoUrl = useAuthStore((state) => state.authPhotoUrl);
  const authEmailVerified = useAuthStore((state) => state.authEmailVerified);
  const authPending = useAuthStore((state) => state.authPending);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isAllowed = useAuthStore((state) => state.isAllowed);
  const isInvited = useAuthStore((state) => state.isInvited);
  const lastSignIn = useAuthStore((state) => state.lastSignIn);
  const premium = useAuthStore((state) => state.premium);
  const credits = useAuthStore((state) => state.credits);

  const previousUidRef = useRef<string>("");

  // Memoize auth data to prevent recreating object on every render
  const authData = useMemo(
    () => ({
      uid,
      firebaseUid,
      authEmail,
      authDisplayName,
      authPhotoUrl,
      authEmailVerified,
      authReady,
      authPending,
      isAdmin,
      isAllowed,
      isInvited,
      lastSignIn,
      premium,
      credits,
    }),
    [
      uid,
      firebaseUid,
      authEmail,
      authDisplayName,
      authPhotoUrl,
      authEmailVerified,
      authReady,
      authPending,
      isAdmin,
      isAllowed,
      isInvited,
      lastSignIn,
      premium,
      credits,
    ]
  );

  useEffect(() => {
    const syncToFirestore = async () => {
      // Only sync if we have a UID and it's ready
      if (!uid || !authReady) {
        return;
      }

      // Skip if UID hasn't changed (already synced)
      if (previousUidRef.current === uid) {
        return;
      }

      previousUidRef.current = uid;

      try {
        await updateUserDetailsInFirestore(authData, uid);
        logger.debug("Auth details synced to Firestore");
      } catch (error) {
        logger.error("Failed to sync auth details to Firestore", error);
      }
    };

    syncToFirestore();
  }, [uid, authReady, authData]);
}
