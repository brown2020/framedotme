import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { buildConfig } from "@/lib/env";

// Validate and extract Firebase Admin credentials
const adminCredentials = buildConfig({
  type: { key: 'FIREBASE_TYPE', required: true },
  projectId: { key: 'FIREBASE_PROJECT_ID', required: true },
  privateKeyId: { key: 'FIREBASE_PRIVATE_KEY_ID', required: true },
  privateKey: { key: 'FIREBASE_PRIVATE_KEY', required: true },
  clientEmail: { key: 'FIREBASE_CLIENT_EMAIL', required: true },
  clientId: { key: 'FIREBASE_CLIENT_ID', required: true },
  authUri: { key: 'FIREBASE_AUTH_URI', required: true },
  tokenUri: { key: 'FIREBASE_TOKEN_URI', required: true },
  authProviderX509CertUrl: { key: 'FIREBASE_AUTH_PROVIDER_X509_CERT_URL', required: true },
  clientCertsUrl: { key: 'FIREBASE_CLIENT_CERTS_URL', required: true },
});

// Process private key to handle newlines
// Safe to assert non-undefined since buildConfig validates required fields
const processedCredentials = {
  ...adminCredentials,
  privateKey: adminCredentials.privateKey!.replace(/\\n/g, "\n"),
};

const storageBucket = buildConfig({
  bucket: { key: 'NEXT_PUBLIC_FIREBASE_STORAGEBUCKET', required: true },
}).bucket;

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
