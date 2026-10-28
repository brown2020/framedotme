"use server";

import { requireAuthenticatedSession } from "@/services/sessionService";
import { deleteAccountData } from "@/services/accountService";
import {
  authorizeRecordingUpload,
  finalizeRecording,
  releaseRecordingGrant,
} from "@/services/recordingGrantService";
import { AppError } from "@/types/errors";

/**
 * In-app purchase messages are not trusted. Receipts are not granted until a
 * store verifier exists; calling this never changes credits.
 */
export async function submitIapReceipt(): Promise<void> {
  await requireAuthenticatedSession();
  throw new AppError(
    "In-app purchases are not available. Buy credits on the web checkout.",
    "payment",
  );
}

export async function deleteCurrentAccount(): Promise<void> {
  const session = await requireAuthenticatedSession();
  await deleteAccountData(session.uid);
}

export async function authorizeRecordingSave(
  filename: string,
): Promise<{ filename: string; cost: number }> {
  const session = await requireAuthenticatedSession();
  return authorizeRecordingUpload(session.uid, filename);
}

export async function completeRecordingSave(input: {
  filename: string;
  downloadUrl: string;
}): Promise<void> {
  const session = await requireAuthenticatedSession();
  await finalizeRecording({
    uid: session.uid,
    filename: input.filename,
    downloadUrl: input.downloadUrl,
  });
}

export async function cancelRecordingSave(filename: string): Promise<void> {
  const session = await requireAuthenticatedSession();
  await releaseRecordingGrant(session.uid, filename);
}
