import { useCallback } from "react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { useAuthStore } from "@/zustand/useAuthStore";
import { updateRecorderStatus } from "@/services/recorderStatusService";
import type { RecorderStatusType } from "@/types/recorder";
import { logger } from "@/utils/logger";

/**
 * Hook that provides recorder status and update function
 * Handles both local state and Firestore synchronization
 */
export function useRecorderStatus() {
  const recorderStatus = useRecorderStatusStore((state) => state.recorderStatus);
  const setRecorderStatus = useRecorderStatusStore((state) => state.setRecorderStatus);
  const isUpdatingFromFirestore = useRecorderStatusStore((state) => state.isUpdatingFromFirestore);
  const uid = useAuthStore((state) => state.uid);

  const updateStatus = useCallback(
    async (status: RecorderStatusType) => {
      // Update local state immediately
      setRecorderStatus(status);

      // Only sync to Firestore if not already updating from Firestore
      if (uid && !isUpdatingFromFirestore) {
        try {
          await updateRecorderStatus(uid, status);
        } catch (error) {
          logger.error("Failed to sync recorder status to Firestore", error);
        }
      }
    },
    [uid, setRecorderStatus, isUpdatingFromFirestore]
  );

  return {
    recorderStatus,
    updateStatus,
  };
}
