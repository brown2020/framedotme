import { adminAuth } from "@/firebase/firebaseAdmin";

/**
 * Session verification service
 * Handles server-side token verification for authentication in Node.js runtime
 *
 * NOTE: This service is used by API routes (Node.js runtime) for proper signature verification.
 * The Edge runtime proxy (src/proxy.ts) cannot use this service and instead validates JWT
 * expiry without signature verification. Returns null on failures for graceful handling.
 */

/**
 * Verifies a session cookie and returns user information
 *
 * @param sessionCookie - The session cookie to verify
 * @returns User info if valid, null if invalid or missing
 */
export async function verifySessionToken(
  sessionCookie: string,
): Promise<{ uid: string; email?: string | null } | null> {
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Verifies an ID token and returns user information
 *
 * @param idToken - The ID token to verify
 * @returns User info if valid, null if invalid or missing
 */
export async function verifyIdToken(
  idToken: string,
): Promise<{ uid: string; email?: string | null } | null> {
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}
