import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { RecorderStatusType } from "@/types/recorder";
import { logger } from "@/utils/logger";

/**
 * Updates the recorder status in Firestore
 */
export async function updateRecorderStatus(
  uid: string,
  newStatus: RecorderStatusType
): Promise<void> {
  if (!uid) {
    throw new Error("User not authenticated");
  }

  try {
    const settings = {
      recorderStatus: newStatus,
      lastUpdated: new Date(),
    };

    const settingsRef = doc(db, `users/${uid}/settings/recorder`);
    await setDoc(settingsRef, settings, { merge: true });
    logger.debug(`Recorder status updated to: ${newStatus}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to update recorder status", error);
    throw new Error(`Failed to update status: ${errorMessage}`);
  }
}

/**
 * Subscribes to recorder status changes in Firestore
 */
export function subscribeToRecorderStatus(
  uid: string,
  onStatusChange: (status: RecorderStatusType) => void,
  onError: (error: Error) => void
): () => void {
  if (!uid) {
    onError(new Error("User not authenticated"));
    return () => {};
  }

  const settingsRef = doc(db, `users/${uid}/settings/recorder`);

  const unsubscribe = onSnapshot(
    settingsRef,
    (doc) => {
      const data = doc.data();
      if (data?.recorderStatus) {
        onStatusChange(data.recorderStatus);
      }
    },
    (error) => {
      logger.error("Firestore subscription error", error);
      onError(error as Error);
    }
  );

  return unsubscribe;
}
