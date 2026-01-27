import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { logger } from "@/utils/logger";

/**
 * Firebase client configuration
 * These are public keys meant for client-side use
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
};

/**
 * Validates Firebase client configuration
 * Throws error if required fields are missing to fail fast
 */
function validateFirebaseConfig(): void {
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ] as const;

  const missing = requiredFields.filter((field) => !firebaseConfig[field]);

  if (missing.length > 0) {
    const error = `Missing required Firebase configuration: ${missing.join(", ")}. Check your .env file for NEXT_PUBLIC_FIREBASE_* variables`;
    logger.error(error);
    throw new Error(error);
  }
}

// Validate config before initializing Firebase
validateFirebaseConfig();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Make auth persistence explicit so secondary windows/popups reliably share the session.
// Best-effort: if it fails, Firebase falls back to its default behavior.
if (typeof window !== "undefined") {
  void setPersistence(auth, browserLocalPersistence).catch((error) => {
    logger.error("firebaseClient: Failed to set auth persistence", error);
  });
}

export { auth, db, storage };
