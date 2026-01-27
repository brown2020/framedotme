import { adminAuth } from "@/firebase/firebaseAdmin";

export const verifySessionToken = async (
  sessionCookie: string
): Promise<{ uid: string; email?: string | null } | null> => {
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
};

export const verifyIdToken = async (
  idToken: string
): Promise<{ uid: string; email?: string | null } | null> => {
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
};


