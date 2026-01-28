import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

import { getRequiredEnv } from "@/lib/env";

/**
 * Firebase Admin credentials
 * Extracted and processed from environment variables
 * Using getRequiredEnv ensures explicit, clear errors if credentials are missing
 */
const processedCredentials = {
  type: getRequiredEnv('FIREBASE_TYPE'),
  projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
  privateKeyId: getRequiredEnv('FIREBASE_PRIVATE_KEY_ID'),
  privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, "\n"),
  clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
  clientId: getRequiredEnv('FIREBASE_CLIENT_ID'),
  authUri: getRequiredEnv('FIREBASE_AUTH_URI'),
  tokenUri: getRequiredEnv('FIREBASE_TOKEN_URI'),
  authProviderX509CertUrl: getRequiredEnv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
  clientCertsUrl: getRequiredEnv('FIREBASE_CLIENT_CERTS_URL'),
};

// Note: Storage bucket uses NEXT_PUBLIC_ prefix but is safe to use getRequiredEnv here
// because firebaseAdmin only runs server-side (never in browser/static builds)
const storageBucket = getRequiredEnv('NEXT_PUBLIC_FIREBASE_STORAGEBUCKET');

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(processedCredentials),
    storageBucket,
  });
}

const adminBucket = admin.storage().bucket();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminBucket, adminDb, adminAuth, admin };
