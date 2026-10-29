import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import type { RecorderStatusType } from "@/types/recorder";
import { validateUserId } from "@/lib/validation";
import { getUserRecorderSettingsPath } from "@/lib/firestore";
import { firestoreWrite } from "@/lib/firestoreOperations";
import { remoteUpdatedAtMillis } from "@/lib/recorderStatusTime";

export type RemoteRecorderStatus = {
  status: RecorderStatusType;
  message: string | null;
  updatedAt: number;
};

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
export const updateRecorderStatus = async (
  uid: string,
  newStatus: RecorderStatusType,
  message: string | null = null,
  updatedAt = Date.now(),
): Promise<void> => {
  const validatedUid = validateUserId(uid);

  const settings = {
    recorderStatus: newStatus,
    recorderError: newStatus === "error" ? message : null,
    lastUpdated: updatedAt,
  };

  await firestoreWrite(
    () => {
      const settingsRef = doc(db, getUserRecorderSettingsPath(validatedUid));
      return setDoc(settingsRef, settings, { merge: true });
    },
    'Failed to update recorder status',
    { userId: validatedUid, status: newStatus }
  );
};

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
export const subscribeToRecorderStatus = (
  uid: string,
  onStatusChange: (update: RemoteRecorderStatus) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    const validatedUid = validateUserId(uid);
    const settingsRef = doc(db, getUserRecorderSettingsPath(validatedUid));

    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        const data = doc.data();
        if (data?.recorderStatus) {
          onStatusChange({
            status: data.recorderStatus,
            message: typeof data.recorderError === "string" ? data.recorderError : null,
            updatedAt: remoteUpdatedAtMillis(data.lastUpdated),
          });
        }
      },
      (error) => {
        onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (error) {
    onError(error as Error);
    return () => {};
  }
};
