import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { logger } from "@/utils/logger";

function requirePublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_APIKEY",
    process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  ),
  authDomain: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_AUTHDOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  ),
  projectId: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_PROJECTID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  ),
  storageBucket: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_STORAGEBUCKET",
    process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  ),
  messagingSenderId: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  ),
  appId: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_APPID",
    process.env.NEXT_PUBLIC_FIREBASE_APPID,
  ),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Make auth persistence explicit so secondary windows/popups reliably share the session.
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    logger.error("firebaseClient: Failed to set auth persistence", error);
  });
}

export { auth, db, storage };
