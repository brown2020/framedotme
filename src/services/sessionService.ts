import "server-only";

import { jwtVerify } from "jose";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/constants/auth";
import { AppError } from "@/types/errors";

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

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET or NEXTAUTH_SECRET environment variable not configured",
    );
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters for security");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifies a session cookie and returns user information
 *
 * @param sessionCookie - The session cookie to verify
 * @returns User info if valid, null if invalid or missing
 */
export async function verifySessionToken(
  sessionCookie: string,
): Promise<AuthenticatedSession | null> {
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;

    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
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
