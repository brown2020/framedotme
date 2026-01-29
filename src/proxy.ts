/**
 * Next.js 16 Proxy - handles route protection at the edge.
 *
 * SECURITY MODEL:
 * This proxy validates JWT expiry claims WITHOUT signature verification.
 * Signature verification requires Firebase Admin SDK (Node.js runtime), which
 * is unavailable in Edge runtime where proxy.ts executes.
 *
 * RISK ACCEPTANCE:
 * - Unsigned validation is intentional for this use case
 * - Primary purpose: Prevent flash of protected content and improve UX
 * - Security boundary: All API/data access verified server-side via Firestore rules
 * - Impact: Attacker with forged token could briefly see protected UI shells (no data)
 *
 * For production security:
 * - All data access is protected by Firestore security rules
 * - API routes verify tokens server-side with Firebase Admin SDK
 * - This proxy is UX-focused, not a security boundary
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./constants/config";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Cookie names for authentication
 * Note: Must match NEXT_PUBLIC_COOKIE_NAME from environment
 * Using explicit name for Edge runtime compatibility
 */
const CLIENT_ID_TOKEN_COOKIE_NAME = "framedotmeAuthToken";
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

/**
 * JWT validation configuration
 */
const JWT_VALIDATION_CONFIG = {
  /** Leeway in seconds to account for clock skew when validating JWT expiry */
  EXPIRY_LEEWAY_SECONDS: 5,
} as const;

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
// JWT PARSING AND VALIDATION UTILITIES
// ============================================================================

/**
 * Base64 encoding uses groups of 4 characters.
 * When the input length is not a multiple of 4, padding with "=" is required.
 */
const BASE64_PADDING_SIZE = 4;

/**
 * Decodes base64url JWT payload to UTF-8.
 * Handles both Edge runtime (atob) and Node runtime (Buffer).
 */
function base64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingNeeded =
    (BASE64_PADDING_SIZE - (base64.length % BASE64_PADDING_SIZE)) %
    BASE64_PADDING_SIZE;
  const padded = base64.padEnd(base64.length + paddingNeeded, "=");

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  throw new Error("No base64 decoder available");
}

/**
 * Milliseconds per second conversion constant.
 */
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Checks if a JWT token's expiry claim is still valid (unsigned validation).
 * Does NOT verify signature - see proxy.ts header for security model.
 *
 * @param token - The JWT token to check
 * @returns True if the token has a valid, unexpired exp claim
 */
function hasUnexpiredJwtClaimUnsigned(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;

  const nowSeconds = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
  // Add leeway to account for small time differences between servers
  return payload.exp > nowSeconds - JWT_VALIDATION_CONFIG.EXPIRY_LEEWAY_SECONDS;
}

/**
 * Firebase JWT token payload structure.
 */
interface FirebaseJwtPayload {
  exp?: number;
  sub?: string;
  user_id?: string;
}

/**
 * Parses a JWT token and extracts its payload.
 * Returns null if the token is malformed or cannot be parsed.
 * Does not validate signature or expiry—use hasUnexpiredJwtClaimUnsigned for expiry validation.
 *
 * @param token - The JWT token string
 * @returns The parsed payload or null if invalid
 */
function parseJwtPayload(token: string): FirebaseJwtPayload | null {
  const jwtParts = token.split(".");
  if (jwtParts.length !== 3) return null;

  const payload = jwtParts[1];
  if (!payload) return null;

  try {
    return JSON.parse(base64UrlToUtf8(payload)) as FirebaseJwtPayload;
  } catch {
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
  response.cookies.delete({
    name: CLIENT_ID_TOKEN_COOKIE_NAME,
    path: COOKIE_PATH,
  });
  response.cookies.delete({ name: "frame_session", path: COOKIE_PATH });
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
// RESPONSE BUILDING UTILITIES
// ============================================================================

interface DebugContext {
  path: string;
  cookiePresent: boolean;
  jwtValid: boolean;
  userId?: string | null;
  isAuthPage?: boolean;
  isProtected?: boolean;
}

/**
 * Adds debug headers to the response in development mode.
 */
function withDebugHeaders(
  response: NextResponse,
  opts: DebugContext,
): NextResponse {
  if (process.env.NODE_ENV === "production") return response;
  response.headers.set("x-frame-path", opts.path);
  response.headers.set(
    "x-frame-auth-cookie",
    opts.cookiePresent ? "present" : "absent",
  );
  response.headers.set(
    "x-frame-auth-jwt",
    opts.jwtValid ? "valid" : "invalid_or_expired",
  );
  if (opts.userId) response.headers.set("x-frame-user-id", opts.userId);
  if (typeof opts.isAuthPage === "boolean") {
    response.headers.set(
      "x-frame-auth-page",
      opts.isAuthPage ? "true" : "false",
    );
  }
  if (typeof opts.isProtected === "boolean") {
    response.headers.set(
      "x-frame-protected",
      opts.isProtected ? "true" : "false",
    );
  }
  return response;
}

/**
 * Handles authenticated user on auth pages
 * Allows home page access but redirects from login finish
 */
function handleAuthenticatedOnAuthPage(
  request: NextRequest,
  debugContext: DebugContext,
): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow authenticated users to visit home page
  if (pathname === ROUTES.home) {
    return withDebugHeaders(NextResponse.next(), debugContext);
  }

  // Redirect from login finish to recordings after successful auth
  const url = request.nextUrl.clone();
  url.pathname = ROUTES.recordings;
  return withDebugHeaders(NextResponse.redirect(url), debugContext);
}

/**
 * Handles invalid cookie on auth pages - clear and stay
 */
function handleInvalidCookieOnAuthPage(
  debugContext: DebugContext,
): NextResponse {
  const response = NextResponse.next();
  clearAuthCookies(response);
  return withDebugHeaders(response, debugContext);
}

/**
 * Handles unauthenticated user on protected routes - redirect to login
 */
function handleUnauthenticatedOnProtectedRoute(
  request: NextRequest,
  pathname: string,
  debugContext: DebugContext,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = ROUTES.home;
  const response = NextResponse.redirect(url);
  clearAuthCookies(response);
  setRedirectCookie(response, pathname);
  return withDebugHeaders(response, debugContext);
}

/**
 * Handles normal request flow - allow through with optional user ID header
 */
function handleNormalRequest(
  userId: string | null,
  jwtValid: boolean,
  debugContext: DebugContext,
): NextResponse {
  const response = NextResponse.next();
  if (userId && jwtValid) {
    response.headers.set("x-user-id", userId);
  }
  return withDebugHeaders(response, debugContext);
}

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

/**
 * Next.js 16 Proxy - handles route protection at the edge.
 *
 * Execution flow:
 * 1. Runs before every page render (edge runtime)
 * 2. Validates JWT token from cookie (expiry check only, no signature verification)
 * 3. Applies routing logic with early returns for clarity
 * 4. Handles redirects and cookie cleanup as needed
 */
export function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Public routes always allowed
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Determine route type
    const onAuthPage = isAuthPage(pathname);
    const onProtectedRoute = isProtectedRoute(pathname);

    // Extract and validate auth token
    const authToken = request.cookies.get(CLIENT_ID_TOKEN_COOKIE_NAME)?.value;
    const cookiePresent = authToken != null;
    const payload = authToken != null ? parseJwtPayload(authToken) : null;
    const jwtValid =
      authToken != null &&
      payload != null &&
      hasUnexpiredJwtClaimUnsigned(authToken);
    const userId = payload?.user_id ?? payload?.sub ?? null;
    const isAuthenticated = cookiePresent && jwtValid;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Proxy Debug]", {
        pathname,
        cookieName: CLIENT_ID_TOKEN_COOKIE_NAME,
        cookiePresent,
        jwtValid,
        userId,
        isAuthenticated,
        onAuthPage,
        onProtectedRoute,
        allCookies: request.cookies.getAll().map((c) => c.name),
      });
    }

    const debugContext: DebugContext = {
      path: pathname,
      cookiePresent,
      jwtValid,
      userId,
      isAuthPage: onAuthPage,
      isProtected: onProtectedRoute,
    };

    // Auth pages with valid authentication => redirect to app
    if (onAuthPage && isAuthenticated) {
      return handleAuthenticatedOnAuthPage(request, debugContext);
    }

    // Auth pages with invalid cookie => clear cookie and stay
    if (onAuthPage && cookiePresent && !jwtValid) {
      return handleInvalidCookieOnAuthPage(debugContext);
    }

    // Protected routes without authentication => redirect to login
    if (onProtectedRoute && !isAuthenticated) {
      return handleUnauthenticatedOnProtectedRoute(
        request,
        pathname,
        debugContext,
      );
    }

    // All other cases => allow through
    return handleNormalRequest(userId, jwtValid, debugContext);
  } catch (error) {
    const { pathname } = request.nextUrl;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Proxy error:", error, { pathname });
    }

    const onAuthPage = isAuthPage(pathname);
    const onProtectedRoute = isProtectedRoute(pathname);

    // For auth pages, allow through even on error to avoid redirect loops
    if (onAuthPage) {
      return NextResponse.next();
    }

    // For protected routes, fail closed (redirect to login) as a security measure
    if (onProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.home;
      const response = NextResponse.redirect(url);
      clearAuthCookies(response);
      setRedirectCookie(response, pathname);
      return response;
    }

    // For public routes, allow through despite error
    return NextResponse.next();
  }
}

// Keep default export for compatibility
export default proxy;

/**
 * Proxy configuration.
 * Note: Must be static for Next.js build-time analysis.
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
