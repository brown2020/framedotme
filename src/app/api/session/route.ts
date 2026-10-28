import { NextResponse } from "next/server";
import { adminAuth } from "@/firebase/firebaseAdmin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS } from "@/constants/auth";
import { logger } from "@/utils/logger";
import {
  validateCsrfToken,
  setCsrfTokenCookie,
  CSRF_COOKIE_NAME,
} from "@/lib/security/csrf";
import {
  issueAppSession,
  readAppSessionClaims,
  revokeAppSessions,
} from "@/services/sessionRegistry";

const SESSION_DURATION_SECONDS = Math.floor(SESSION_EXPIRES_IN_MS / 1000);

export async function GET() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  setCsrfTokenCookie(response);
  return response;
}

export async function POST(request: Request) {
  try {
    const csrfResult = validateCsrfToken(request);
    if (!csrfResult.valid) {
      logger.warn("CSRF validation failed", { error: csrfResult.error });
      return NextResponse.json({ error: csrfResult.error }, { status: 403 });
    }

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

    // checkRevoked rejects tokens Firebase has already revoked.
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const sessionToken = await issueAppSession({
      uid: decoded.uid,
      email: decoded.email ?? "",
      emailVerified: decoded.email_verified ?? false,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    setCsrfTokenCookie(response);

    logger.debug("Session cookie created successfully", { uid: decoded.uid });
    return response;
  } catch (error) {
    logger.error("Failed to create session cookie", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const csrfResult = validateCsrfToken(request);
  if (!csrfResult.valid) {
    logger.warn("CSRF validation failed on DELETE", { error: csrfResult.error });
    return NextResponse.json({ error: csrfResult.error }, { status: 403 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  const sessionToken = sessionMatch
    ? decodeURIComponent(sessionMatch.slice(SESSION_COOKIE_NAME.length + 1))
    : "";
  if (sessionToken) {
    const claims = await readAppSessionClaims(sessionToken);
    if (claims) {
      await revokeAppSessions(claims.uid).catch((error: unknown) => {
        logger.warn("Failed to revoke server sessions", error);
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: "/" });
  response.cookies.delete({ name: CSRF_COOKIE_NAME, path: "/" });
  return response;
}
