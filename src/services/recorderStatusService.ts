import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { RecorderStatusType } from "@/types/recorder";
import { logger } from "@/utils/logger";
import { validateUserId } from "@/lib/validation";
import { getUserRecorderSettingsPath } from "@/lib/firestore";

/**
 * Updates the recorder status in Firestore
 * 
 * @param uid - The user's unique identifier
 * @param newStatus - The new recorder status to set
 * @returns Promise that resolves when update is complete
 * @throws {ValidationError} If uid is invalid
 * @throws {Error} If Firestore update fails
 * 
 * @example
 * ```typescript
 * await updateRecorderStatus(user.uid, 'recording');
 * ```
 */
export async function updateRecorderStatus(
  uid: string,
  newStatus: RecorderStatusType
): Promise<void> {
  const validatedUid = validateUserId(uid);

  try {
    const settings = {
      recorderStatus: newStatus,
      lastUpdated: new Date(),
    };

    const settingsRef = doc(db, getUserRecorderSettingsPath(validatedUid));
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
 * Returns an unsubscribe function to stop listening to changes
 * 
 * @param uid - The user's unique identifier
 * @param onStatusChange - Callback invoked when status changes
 * @param onError - Callback invoked when subscription error occurs
 * @returns Unsubscribe function to stop listening
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * const unsubscribe = subscribeToRecorderStatus(
 *   user.uid,
 *   (status) => console.log('New status:', status),
 *   (error) => console.error('Subscription error:', error)
 * );
 * 
 * // Later, to cleanup:
 * unsubscribe();
 * ```
 */
export function subscribeToRecorderStatus(
  uid: string,
  onStatusChange: (status: RecorderStatusType) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const validatedUid = validateUserId(uid);
    const settingsRef = doc(db, getUserRecorderSettingsPath(validatedUid));

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
  } catch (error) {
    onError(error as Error);
    return () => {};
  }
}
