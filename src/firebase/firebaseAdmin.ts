import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Validate required environment variables
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

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Safe to use non-null assertions after validation above
const adminCredentials = {
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

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(adminCredentials),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET!,
  });
}
const adminBucket = admin.storage().bucket();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminBucket, adminDb, adminAuth, admin };
