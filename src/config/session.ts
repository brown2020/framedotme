import { adminAuth } from "@/firebase/firebaseAdmin";

type VerifiedSession =
  | { uid: string; email?: string | null }
  | null;

export const verifySessionToken = async (sessionCookie: string): Promise<VerifiedSession> => {
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
};

export const verifyIdToken = async (idToken: string): Promise<VerifiedSession> => {
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
};


