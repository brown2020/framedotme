/**
 * Next.js 16 Proxy - handles route protection at the edge.
 *
 * AUTHENTICATION STRATEGY:
 * This proxy validates server-signed JWT session cookies using the jose library.
 * The session cookie is created by /api/session after Firebase authentication.
 *
 * SECURITY MODEL:
 * - Session JWT is signed with a secret key (HS256)
 * - Signature is verified in Edge runtime using jose
 * - All data access is further protected by Firestore security rules
 * - This provides proper authentication without Node.js runtime
 */

import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./constants/config";

const SESSION_COOKIE_NAME = "frame_session";
const REDIRECT_URL_COOKIE_NAME = "redirect_url";
const COOKIE_PATH = "/";

const PROTECTED_ROUTES = [
  ROUTES.capture,
  ROUTES.recordings,
  ROUTES.profile,
  ROUTES.paymentAttempt,
  ROUTES.paymentSuccess,
  ROUTES.videoControls,
] as const;

/** Dedicated auth surfaces — signed-in users are redirected away (except home). */
const AUTH_PAGES = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.loginFinish,
] as const;

const PUBLIC_ROUTES = [
  ROUTES.about,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.support,
  ROUTES.home,
] as const;

function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

function isAuthPage(path: string): boolean {
  return AUTH_PAGES.some(
    (page) => path === page || path.startsWith(`${page}/`),
  );
}

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

type SessionData = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters for security");
  }
  return new TextEncoder().encode(secret);
}

async function validateSessionToken(
  token: string,
): Promise<SessionData | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub) {
      return null;
    }

    return {
      uid: payload.sub,
      email: (payload.email as string) ?? "",
      emailVerified: (payload.email_verified as boolean) ?? false,
    };
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (!msg.includes("expired") && !msg.includes("signature")) {
        if (process.env.NODE_ENV === "development") {
          console.error("[Proxy] Unexpected JWT validation error:", error);
        }
      }
    }
    return null;
  }
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: COOKIE_PATH });
  response.cookies.delete({ name: "framedotmeAuthToken", path: COOKIE_PATH });
}

function setRedirectCookie(response: NextResponse, pathname: string): void {
  response.cookies.set(REDIRECT_URL_COOKIE_NAME, pathname, {
    sameSite: "lax",
    path: COOKIE_PATH,
  });
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (isPublicRoute(pathname) && !isAuthPage(pathname)) {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionToken
      ? await validateSessionToken(sessionToken)
      : null;
    const isAuthenticated = !!session?.uid;

    if (process.env.NODE_ENV === "development") {
      console.log("[Proxy Debug]", {
        pathname,
        hasSessionCookie: !!sessionToken,
        isAuthenticated,
        userId: session?.uid,
        isAuthPage: isAuthPage(pathname),
        isProtected: isProtectedRoute(pathname),
      });
    }

    if (isAuthPage(pathname)) {
      if (pathname === ROUTES.loginFinish) {
        if (isAuthenticated) {
          return NextResponse.redirect(new URL(ROUTES.recordings, request.url));
        }
        return NextResponse.next();
      }

      // /login, /signup, /forgot-password: bounce signed-in users home
      if (isAuthenticated) {
        return NextResponse.redirect(new URL(ROUTES.home, request.url));
      }
      return NextResponse.next();
    }

    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        const response = NextResponse.redirect(
          new URL(ROUTES.login, request.url),
        );
        clearAuthCookies(response);
        setRedirectCookie(response, pathname);
        return response;
      }

      const response = NextResponse.next();
      response.headers.set("x-user-id", session.uid);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    const { pathname } = request.nextUrl;

    if (process.env.NODE_ENV === "development") {
      console.error("[Proxy] Error:", error, { pathname });
    }

    if (isProtectedRoute(pathname)) {
      const response = NextResponse.redirect(
        new URL(ROUTES.login, request.url),
      );
      clearAuthCookies(response);
      return response;
    }

    return NextResponse.next();
  }
}

export default proxy;

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/loginfinish/:path*",
    "/capture/:path*",
    "/recordings/:path*",
    "/profile/:path*",
    "/payment-attempt/:path*",
    "/payment-success/:path*",
    "/videocontrols/:path*",
  ],
};
