import { useEffect, useRef } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { updateUserDetailsInFirestore } from "@/services/userService";
import { logger } from "@/utils/logger";

/**
 * Hook to sync auth state changes to Firestore
 * Handles the side effect of persisting auth details separately from state management
 */
export function useSyncAuthToFirestore() {
  const authState = useAuthStore();
  const previousUidRef = useRef<string>("");

  useEffect(() => {
    const syncToFirestore = async () => {
      // Only sync if we have a UID and it's a meaningful update
      if (!authState.uid || !authState.authReady) {
        return;
      }

      // Skip if UID hasn't changed and this isn't the first sync
      if (previousUidRef.current === authState.uid) {
        return;
      }

      previousUidRef.current = authState.uid;

      try {
        await updateUserDetailsInFirestore(authState, authState.uid);
        logger.debug("Auth details synced to Firestore");
      } catch (error) {
        logger.error("Failed to sync auth details to Firestore", error);
      }
    };

    syncToFirestore();
  }, [authState]);
}
