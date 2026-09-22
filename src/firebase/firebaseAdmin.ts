import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { logger } from "@/utils/logger";

/**
 * Initialize Firebase Admin lazily so `next build` can collect pages in CI
 * without server credentials present at import time.
 */
function initializeAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn(
      "firebaseAdmin missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY",
    );
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  });
}

function getAdminAuth(): Auth {
  const app = initializeAdmin();
  if (!app) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }
  return getAuth(app);
}

function createLazyAuth(): Auth {
  let instance: Auth | null = null;
  return new Proxy({} as Auth, {
    get(_target, prop, receiver) {
      if (!instance) {
        instance = getAdminAuth();
      }
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

/** Lazy Auth accessor — safe to import during build. */
const adminAuth: Auth = createLazyAuth();

export { adminAuth };
