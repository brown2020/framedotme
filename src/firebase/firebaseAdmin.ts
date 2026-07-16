import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function requireServerEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

const projectId = requireServerEnv(
  "FIREBASE_PROJECT_ID",
  process.env.FIREBASE_PROJECT_ID,
);
const clientEmail = requireServerEnv(
  "FIREBASE_CLIENT_EMAIL",
  process.env.FIREBASE_CLIENT_EMAIL,
);
const privateKey = requireServerEnv(
  "FIREBASE_PRIVATE_KEY",
  process.env.FIREBASE_PRIVATE_KEY,
).replace(/\\n/g, "\n");

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  });

const adminAuth = getAuth(app);

export { adminAuth };
