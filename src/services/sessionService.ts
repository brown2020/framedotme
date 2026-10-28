import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/constants/auth";
import { AppError } from "@/types/errors";
import { verifyAppSession } from "@/services/sessionRegistry";

/**
 * Session verification service
 * Verifies the app's custom HS256 session JWT in the Node.js runtime.
 * The token is created by /api/session and is also verified by src/proxy.ts.
 */

export interface AuthenticatedSession {
  uid: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Verifies a session cookie and the server-side session record.
 * A valid signature is not enough after sign-out or expiry of the registry entry.
 */
export async function verifySessionToken(
  sessionCookie: string,
): Promise<AuthenticatedSession | null> {
  if (!sessionCookie) return null;
  const claims = await verifyAppSession(sessionCookie);
  if (!claims) return null;
  return {
    uid: claims.uid,
    email: claims.email,
    emailVerified: claims.emailVerified,
  };
}

/**
 * Reads and verifies the current request's HttpOnly app session cookie.
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";
  return verifySessionToken(sessionCookie);
}

/**
 * Requires an authenticated app session for protected server work.
 */
export async function requireAuthenticatedSession(): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new AppError("Authentication required", "authentication");
  }
  return session;
}
