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

let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;
let auth: ReturnType<typeof getAuth>;
let storage: ReturnType<typeof getStorage>;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  // Make auth persistence explicit so secondary windows/popups reliably share the session.
  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      logger.error("firebaseClient: Failed to set auth persistence", error);
    });
  }
} catch (e) {
  logger.error("Firebase client init failed:", e);
  db = {} as ReturnType<typeof getFirestore>;
  auth = {} as ReturnType<typeof getAuth>;
  storage = {} as ReturnType<typeof getStorage>;
}

export { auth, db, storage };
