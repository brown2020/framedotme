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
  return pathname === ROUTES.home || pathname.startsWith(ROUTES.loginFinish);
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

const handleAuthPage = async (
  request: NextRequest,
  hasToken: boolean
): Promise<NextResponse> => {
  if (!hasToken) {
    return NextResponse.next();
  }

  const session = await getVerifiedUser(request);
  if (session?.uid) {
    return NextResponse.redirect(new URL(ROUTES.capture, request.url));
  }

  // Invalid token: allow access but clear stale cookies
  return clearAuthCookies(NextResponse.next());
};

const handleProtectedPage = async (
  request: NextRequest,
  hasToken: boolean,
  pathname: string
): Promise<NextResponse> => {
  if (!hasToken) {
    const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
    setRedirectCookie(response, pathname);
    return response;
  }

  const session = await getVerifiedUser(request);
  if (session?.uid) {
    const response = NextResponse.next();
    response.headers.set("x-user-id", session.uid);
    return response;
  }

  // Invalid token: redirect to auth
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
      return handleAuthPage(request, hasToken);
    }

    return handleProtectedPage(request, hasToken, pathname);
  } catch (error) {
    return handleProxyError(error, request);
  }
};

export const config = {
  matcher: [
    // Auth routes
    "/",
    "/loginfinish",
    // Protected routes
    "/capture/:path*",
    "/recordings/:path*",
    "/profile/:path*",
    "/payment-attempt/:path*",
    "/payment-success/:path*",
    "/videocontrols/:path*",
  ],
};


