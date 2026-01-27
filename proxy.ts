import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CLIENT_ID_TOKEN_COOKIE_NAME,
  REDIRECT_URL_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "./src/constants/auth";
import { ROUTES } from "./src/constants/routes";
import { verifyIdToken, verifySessionToken } from "./src/config/session";
import { logger } from "./src/utils/logger";

const COOKIE_PATH = "/";

const isAuthPage = (pathname: string): boolean => {
  return pathname === ROUTES.home || pathname === ROUTES.loginFinish || pathname.startsWith(`${ROUTES.loginFinish}/`);
};

const hasAuthTokens = (request: NextRequest): boolean => {
  return Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.cookies.get(CLIENT_ID_TOKEN_COOKIE_NAME)?.value
  );
};

const clearAuthCookies = (response: NextResponse): NextResponse => {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: COOKIE_PATH });
  response.cookies.delete({
    name: CLIENT_ID_TOKEN_COOKIE_NAME,
    path: COOKIE_PATH,
  });
  return response;
};

const setRedirectCookie = (response: NextResponse, pathname: string): void => {
  response.cookies.set(REDIRECT_URL_COOKIE_NAME, pathname, {
    sameSite: "lax",
    path: COOKIE_PATH,
  });
};

const getVerifiedUser = async (request: NextRequest) => {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) return verifySessionToken(sessionCookie);

  const clientIdToken = request.cookies.get(CLIENT_ID_TOKEN_COOKIE_NAME)?.value;
  if (clientIdToken) return verifyIdToken(clientIdToken);

  return null;
};

/**
 * Handles access to auth pages (/, /loginfinish)
 * Strategy: Allow unauthenticated users, redirect authenticated users away
 */
const checkAuthPageAccess = async (
  request: NextRequest,
  hasToken: boolean
): Promise<NextResponse> => {
  // No token: Allow access (user can sign in)
  if (!hasToken) {
    return NextResponse.next();
  }

  const session = await getVerifiedUser(request);
  
  // Valid token: Redirect authenticated users to app
  if (session?.uid) {
    return NextResponse.redirect(new URL(ROUTES.recordings, request.url));
  }

  // Invalid/expired token: Clear stale cookies and allow access
  return clearAuthCookies(NextResponse.next());
};

/**
 * Enforces authentication for protected pages
 * Strategy: Require valid authentication, redirect unauthenticated users to login
 */
const enforceProtectedPageAccess = async (
  request: NextRequest,
  hasToken: boolean,
  pathname: string
): Promise<NextResponse> => {
  // No token: Redirect to login and save intended destination
  if (!hasToken) {
    const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
    setRedirectCookie(response, pathname);
    return response;
  }

  const session = await getVerifiedUser(request);
  
  // Valid token: Allow access and pass user ID to app
  if (session?.uid) {
    const response = NextResponse.next();
    response.headers.set("x-user-id", session.uid);
    return response;
  }

  // Invalid/expired token: Clear cookies, redirect to login
  const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
  clearAuthCookies(response);
  setRedirectCookie(response, pathname);
  return response;
};

const handleProxyError = (error: unknown, request: NextRequest): NextResponse => {
  logger.error("Proxy error:", error);
  return clearAuthCookies(
    NextResponse.redirect(new URL(ROUTES.home, request.url))
  );
};

export const proxy = async (request: NextRequest) => {
  try {
    const { pathname } = request.nextUrl;
    const onAuthPage = isAuthPage(pathname);
    const hasToken = hasAuthTokens(request);

    if (onAuthPage) {
      return checkAuthPageAccess(request, hasToken);
    }

    return enforceProtectedPageAccess(request, hasToken, pathname);
  } catch (error) {
    return handleProxyError(error, request);
  }
};

export const config = {
  matcher: [
    // Auth routes
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


