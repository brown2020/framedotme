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

  const previousUidRef = useRef<string>("");

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
  }, [uid, authReady]);
}
