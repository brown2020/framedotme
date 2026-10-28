import "server-only";

import { adminDb } from "@/firebase/firebaseAdmin";
import { RECORDING_CREDIT_COST } from "@/constants/payment";
import { LEGACY_RECORDINGS_COLLECTION } from "@/lib/firestore";
import { validateFilename } from "@/lib/validation";
import { AppError } from "@/types/errors";
import { FieldValue } from "firebase-admin/firestore";

const GRANT_TTL_MS = 15 * 60 * 1000;

function profileRef(uid: string) {
  return adminDb.doc(`users/${uid}/profile/userData`);
}

function grantRef(uid: string, filename: string) {
  return adminDb.doc(`users/${uid}/uploadGrants/${filename}`);
}

function isAllowedDownloadUrl(downloadUrl: string): boolean {
  try {
    const url = new URL(downloadUrl);
    return (
      url.protocol === "https:" &&
      (url.hostname === "firebasestorage.googleapis.com" ||
        url.hostname.endsWith(".firebasestorage.app"))
    );
  } catch {
    return false;
  }
}

/**
 * Charges credits and writes an upload grant the Storage rules require.
 * Business failures are returned instead of thrown inside the transaction so
 * Firestore does not retry a deterministic denial.
 */
export async function authorizeRecordingUpload(
  uid: string,
  filename: string,
): Promise<{ filename: string; cost: number }> {
  const validatedFilename = validateFilename(filename);
  const profile = profileRef(uid);
  const grant = grantRef(uid, validatedFilename);
  let denial: AppError | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const profileSnap = await transaction.get(profile);
    const grantSnap = await transaction.get(grant);
    const credits = profileSnap.exists ? Number(profileSnap.data()?.credits ?? 0) : 0;
    if (!Number.isFinite(credits) || credits < RECORDING_CREDIT_COST) {
      denial = new AppError("Not enough credits to save a recording", "payment");
      return;
    }
    if (grantSnap.exists && grantSnap.data()?.used !== true) {
      denial = new AppError("An upload for this recording is already in progress", "validation");
      return;
    }

    transaction.set(profile, { credits: credits - RECORDING_CREDIT_COST }, { merge: true });
    transaction.set(grant, {
      filename: validatedFilename,
      used: false,
      expiresAt: Date.now() + GRANT_TTL_MS,
    });
  });

  if (denial) throw denial;
  return { filename: validatedFilename, cost: RECORDING_CREDIT_COST };
}

export async function releaseRecordingGrant(uid: string, filename: string): Promise<void> {
  const validatedFilename = validateFilename(filename);
  const profile = profileRef(uid);
  const grant = grantRef(uid, validatedFilename);

  await adminDb.runTransaction(async (transaction) => {
    const grantSnap = await transaction.get(grant);
    if (!grantSnap.exists || grantSnap.data()?.used === true) return;
    const profileSnap = await transaction.get(profile);
    const credits = profileSnap.exists ? Number(profileSnap.data()?.credits ?? 0) : 0;
    transaction.set(
      profile,
      { credits: (Number.isFinite(credits) ? credits : 0) + RECORDING_CREDIT_COST },
      { merge: true },
    );
    transaction.delete(grant);
  });
}

export async function finalizeRecording(input: {
  uid: string;
  filename: string;
  downloadUrl: string;
}): Promise<void> {
  const validatedFilename = validateFilename(input.filename);
  if (!isAllowedDownloadUrl(input.downloadUrl)) {
    throw new AppError("Recording URL is not a Firebase Storage download URL", "validation");
  }

  const grant = grantRef(input.uid, validatedFilename);
  const snap = await grant.get();
  if (!snap.exists || snap.data()?.used === true) {
    throw new AppError("Recording upload was not authorized", "validation");
  }
  const expiresAt = Number(snap.data()?.expiresAt ?? 0);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    await releaseRecordingGrant(input.uid, validatedFilename);
    throw new AppError("Recording upload authorization expired", "validation");
  }

  const storagePath = `${input.uid}/${LEGACY_RECORDINGS_COLLECTION}/${validatedFilename}`;
  await adminDb.doc(`users/${input.uid}/${LEGACY_RECORDINGS_COLLECTION}/${validatedFilename}`).set({
    id: validatedFilename,
    downloadUrl: input.downloadUrl,
    storagePath,
    createdAt: FieldValue.serverTimestamp(),
    filename: validatedFilename,
    showOnProfile: false,
  });
  await grant.set({ used: true }, { merge: true });
}
