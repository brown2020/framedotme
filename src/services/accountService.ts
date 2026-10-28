import "server-only";

import { adminAuth, adminDb, adminStorage } from "@/firebase/firebaseAdmin";
import { LEGACY_RECORDINGS_COLLECTION } from "@/lib/firestore";
import { logger } from "@/utils/logger";
import { revokeAppSessions } from "@/services/sessionRegistry";

/**
 * Deletes Firestore data, Storage recordings, the Auth user, and server sessions.
 * Storage deletion is best-effort so a missing object does not strand the account.
 */
export async function deleteAccountData(uid: string): Promise<void> {
  await revokeAppSessions(uid).catch((error: unknown) => {
    logger.warn("Failed to revoke sessions before account deletion", error);
  });

  try {
    const bucket = adminStorage.bucket();
    await bucket.deleteFiles({
      prefix: `${uid}/${LEGACY_RECORDINGS_COLLECTION}/`,
      force: true,
    });
  } catch (error) {
    logger.warn("Failed to delete recording files during account deletion", error);
  }

  await adminDb.recursiveDelete(adminDb.doc(`users/${uid}`));
  await adminAuth.deleteUser(uid);
}
