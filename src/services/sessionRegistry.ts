import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { adminDb } from "@/firebase/firebaseAdmin";
import { SESSION_EXPIRES_IN_MS } from "@/constants/auth";
import {
  isActiveSessionJti,
  pruneSessions,
} from "@/lib/security/sessionRecord";
import { logger } from "@/utils/logger";

const MAX_ACTIVE_SESSIONS = 5;

export interface AppSessionClaims {
  uid: string;
  email: string;
  emailVerified: boolean;
  jti: string;
}

function sessionDoc(uid: string) {
  return adminDb.doc(`users/${uid}/security/session`);
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

async function readSessions(uid: string): Promise<Record<string, unknown>> {
  const snap = await sessionDoc(uid).get();
  const sessions = snap.data()?.sessions;
  if (!sessions || typeof sessions !== "object") return {};
  return sessions as Record<string, unknown>;
}

/**
 * Persists a revocable session id and returns an HS256 JWT that carries it.
 * Signing in again does not erase other devices until the cap is hit.
 * Sign-out deletes the whole map.
 */
export async function issueAppSession(input: {
  uid: string;
  email: string;
  emailVerified: boolean;
}): Promise<string> {
  const jti = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_EXPIRES_IN_MS;
  const ref = sessionDoc(input.uid);

  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists
      ? (snap.data()?.sessions as Record<string, unknown> | undefined)
      : {};
    const sessions = pruneSessions(existing, Date.now(), MAX_ACTIVE_SESSIONS - 1);
    sessions[jti] = expiresAt;
    transaction.set(ref, { sessions });
  });

  const seconds = Math.floor(SESSION_EXPIRES_IN_MS / 1000);
  return new SignJWT({
    email: input.email,
    email_verified: input.emailVerified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.uid)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(getJwtSecret());
}

export async function readAppSessionClaims(
  token: string,
): Promise<AppSessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.jti !== "string" || !payload.jti) {
      return null;
    }
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true,
      jti: payload.jti,
    };
  } catch {
    return null;
  }
}

export async function isAppSessionActive(uid: string, jti: string): Promise<boolean> {
  try {
    const sessions = await readSessions(uid);
    return isActiveSessionJti(sessions, jti, Date.now());
  } catch (error) {
    logger.error("Session registry lookup failed", error);
    return false;
  }
}

export async function verifyAppSession(token: string): Promise<AppSessionClaims | null> {
  const claims = await readAppSessionClaims(token);
  if (!claims) return null;
  const active = await isAppSessionActive(claims.uid, claims.jti);
  if (!active) return null;
  return claims;
}

/** Deletes every server session for the user so stolen cookies stop working. */
export async function revokeAppSessions(uid: string): Promise<void> {
  await sessionDoc(uid).delete();
}
