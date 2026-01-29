import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { adminAuth } from "@/firebase/firebaseAdmin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS } from "@/constants/auth";
import { logger } from "@/utils/logger";

/**
 * Get JWT secret for signing session tokens
 * Uses NEXTAUTH_SECRET or JWT_SECRET environment variable
 */
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

const SESSION_DURATION_SECONDS = Math.floor(SESSION_EXPIRES_IN_MS / 1000);

export async function POST(request: Request) {
  try {
    let body: { idToken?: unknown } | null;
    try {
      body = (await request.json()) as { idToken?: unknown };
    } catch (parseError) {
      logger.error("Invalid JSON in request body", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create custom JWT session cookie (works with Edge runtime validation)
    const secret = getJwtSecret();
    const sessionToken = await new SignJWT({
      email: decoded.email ?? "",
      email_verified: decoded.email_verified ?? false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(decoded.uid)
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
      .sign(secret);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    logger.debug("Session cookie created successfully", { uid: decoded.uid });
    return response;
  } catch (error) {
    logger.error("Failed to create session cookie", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: "/" });
  return response;
}
