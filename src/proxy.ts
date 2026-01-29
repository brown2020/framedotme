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

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Cookie names for authentication
 */
const SESSION_COOKIE_NAME = "frame_session";
const REDIRECT_URL_COOKIE_NAME = "redirect_url";
const COOKIE_PATH = "/";

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  ROUTES.capture,
  ROUTES.recordings,
  ROUTES.profile,
  ROUTES.paymentAttempt,
  ROUTES.paymentSuccess,
  ROUTES.videoControls,
] as const;

/**
 * Auth pages where logged-in users should be redirected away
 */
const AUTH_PAGES = [ROUTES.home, ROUTES.loginFinish] as const;

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  ROUTES.about,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.support,
] as const;

// ============================================================================
// ROUTE CHECKING UTILITIES
// ============================================================================

/**
 * Checks if a given path is a protected route
 */
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

/**
 * Checks if a given path is an auth page
 */
function isAuthPage(path: string): boolean {
  return AUTH_PAGES.some(
    (page) => path === page || path.startsWith(`${page}/`),
  );
}

/**
 * Checks if a given path is a public route
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

// ============================================================================
// JWT VALIDATION
// ============================================================================

/**
 * Session data from JWT payload
 */
type SessionData = {
  uid: string;
  email: string;
  emailVerified: boolean;
};

/**
 * Get JWT secret for token verification
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.error("[Proxy] JWT_SECRET not configured");
    throw new Error("JWT_SECRET not configured");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Validate session JWT and extract user data
 * Works in Edge runtime using jose library
 */
async function validateSessionToken(
  token: string,
): Promise<SessionData | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub) {
      return null;
    }

    return {
      uid: payload.sub,
      email: (payload.email as string) ?? "",
      emailVerified: (payload.email_verified as boolean) ?? false,
    };
  } catch (error) {
    // Token expired or invalid - this is expected, not an error
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (!msg.includes("expired") && !msg.includes("signature")) {
        console.error("[Proxy] Unexpected JWT validation error:", error);
      }
    }
    return null;
  }
}

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Clears all authentication cookies from response
 */
function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: COOKIE_PATH });
  // Also clear the client cookie for clean logout
  response.cookies.delete({ name: "framedotmeAuthToken", path: COOKIE_PATH });
}

/**
 * Sets redirect cookie to remember where user was trying to go
 */
function setRedirectCookie(response: NextResponse, pathname: string): void {
  response.cookies.set(REDIRECT_URL_COOKIE_NAME, pathname, {
    sameSite: "lax",
    path: COOKIE_PATH,
  });
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

/**
 * Next.js 16 Proxy - handles route protection at the edge.
 *
 * Execution flow:
 * 1. Runs before every page render (edge runtime)
 * 2. Validates session JWT from HTTP-only cookie
 * 3. Applies routing logic with early returns for clarity
 * 4. Handles redirects and cookie cleanup as needed
 */
export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Public routes always allowed
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Extract and validate session token
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionToken
      ? await validateSessionToken(sessionToken)
      : null;
    const isAuthenticated = !!session?.uid;

    // Debug logging in development
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

    // Auth pages (home, login finish)
    if (isAuthPage(pathname)) {
      // Allow home page access for both authenticated and unauthenticated
      if (pathname === ROUTES.home) {
        return NextResponse.next();
      }

      // Login finish: redirect authenticated users to recordings
      if (isAuthenticated) {
        return NextResponse.redirect(new URL(ROUTES.recordings, request.url));
      }

      // Unauthenticated on login finish: allow (they're completing login)
      return NextResponse.next();
    }

    // Protected routes
    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        // No session: redirect to login
        const response = NextResponse.redirect(
          new URL(ROUTES.home, request.url),
        );
        clearAuthCookies(response);
        setRedirectCookie(response, pathname);
        return response;
      }

      // Valid session: allow access and pass user ID
      const response = NextResponse.next();
      response.headers.set("x-user-id", session.uid);
      return response;
    }

    // All other routes: allow
    return NextResponse.next();
  } catch (error) {
    const { pathname } = request.nextUrl;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Proxy] Error:", error, { pathname });
    }

    // For protected routes, fail closed (redirect to home)
    if (isProtectedRoute(pathname)) {
      const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
      clearAuthCookies(response);
      return response;
    }

    // For public/auth routes, allow through
    return NextResponse.next();
  }
}

// Keep default export for compatibility
export default proxy;

/**
 * Proxy configuration.
 */
export const config = {
  matcher: [
    // Auth pages
    "/",
    "/loginfinish/:path*",
    // Protected routes
    "/capture/:path*",
    "/recordings/:path*",
    "/profile/:path*",
    "/payment-attempt/:path*",
    "/payment-success/:path*",
    "/videocontrols/:path*",
  ],
};
