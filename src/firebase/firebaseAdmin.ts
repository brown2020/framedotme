import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { logger } from "@/utils/logger";

/**
 * Validates Firebase Admin configuration
 * Throws error if required environment variables are missing to fail fast
 */
function validateFirebaseAdminConfig(): void {
  const requiredEnvVars = [
    'FIREBASE_TYPE',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_AUTH_URI',
    'FIREBASE_TOKEN_URI',
    'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
    'FIREBASE_CLIENT_CERTS_URL',
    'NEXT_PUBLIC_FIREBASE_STORAGEBUCKET',
  ] as const;

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const error = `Missing required Firebase Admin configuration: ${missingVars.join(', ')}. Check your .env file for FIREBASE_* variables`;
    logger.error(error);
    throw new Error(error);
  }
}

// Validate config before initializing Firebase
validateFirebaseAdminConfig();

// Extract and process Firebase Admin credentials
const processedCredentials = {
  type: process.env.FIREBASE_TYPE!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  clientId: process.env.FIREBASE_CLIENT_ID!,
  authUri: process.env.FIREBASE_AUTH_URI!,
  tokenUri: process.env.FIREBASE_TOKEN_URI!,
  authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL!,
  clientCertsUrl: process.env.FIREBASE_CLIENT_CERTS_URL!,
};

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET!;

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
