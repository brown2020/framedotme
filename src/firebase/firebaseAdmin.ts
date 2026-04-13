import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import type { Bucket } from "@google-cloud/storage";

let adminBucket: Bucket;
let adminDb: Firestore;
let adminAuth: Auth;

try {
  const processedCredentials = {
    type: process.env.FIREBASE_TYPE || "service_account",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    clientId: process.env.FIREBASE_CLIENT_ID || "",
    authUri: process.env.FIREBASE_AUTH_URI || "",
    tokenUri: process.env.FIREBASE_TOKEN_URI || "",
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "",
    clientCertsUrl: process.env.FIREBASE_CLIENT_CERTS_URL || "",
  };

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET || "";

  if (!getApps().length) {
    admin.initializeApp({
      credential: admin.credential.cert(processedCredentials as admin.ServiceAccount),
      storageBucket,
    });
  }
  adminBucket = admin.storage().bucket();
  adminDb = admin.firestore();
  adminAuth = admin.auth();
} catch {
  adminBucket = {} as Bucket;
  adminDb = {} as Firestore;
  adminAuth = {} as Auth;
}

export { adminBucket, adminDb, adminAuth, admin };
