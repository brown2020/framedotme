import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  LEGACY_ID_TOKEN_COOKIE_NAME,
  REDIRECT_URL_COOKIE_NAME,
  ROUTES,
  SESSION_COOKIE_NAME,
} from "./src/lib/constants";
import { verifyIdToken, verifySessionToken } from "./src/lib/session";
import { logger } from "./src/utils/logger";

const COOKIE_PATH = "/";

const isAuthPage = (pathname: string): boolean => {
  return pathname === ROUTES.home || pathname.startsWith(ROUTES.loginFinish);
};

const clearAuthCookies = (response: NextResponse): NextResponse => {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: COOKIE_PATH });
  response.cookies.delete({
    name: LEGACY_ID_TOKEN_COOKIE_NAME,
    path: COOKIE_PATH,
  });
  return response;
};

const getVerifiedUser = async (request: NextRequest) => {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) return verifySessionToken(sessionCookie);

  const legacyIdToken = request.cookies.get(LEGACY_ID_TOKEN_COOKIE_NAME)?.value;
  if (legacyIdToken) return verifyIdToken(legacyIdToken);

  return null;
};

export const proxy = async (request: NextRequest) => {
  try {
    const { pathname } = request.nextUrl;
    const onAuthPage = isAuthPage(pathname);

    const hasAnyToken = Boolean(
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
        request.cookies.get(LEGACY_ID_TOKEN_COOKIE_NAME)?.value
    );

    // If on auth page and user looks authenticated, verify and redirect into the app
    if (onAuthPage && hasAnyToken) {
      const session = await getVerifiedUser(request);
      if (session?.uid) {
        return NextResponse.redirect(new URL(ROUTES.capture, request.url));
      }

      // Invalid token on auth page: allow but clear cookies
      return clearAuthCookies(NextResponse.next());
    }

    // If on protected page and no token at all, redirect to auth
    if (!onAuthPage && !hasAnyToken) {
      const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
      response.cookies.set(REDIRECT_URL_COOKIE_NAME, pathname, {
        sameSite: "lax",
        path: COOKIE_PATH,
      });
      return response;
    }

    // If on protected page with token, verify it
    if (!onAuthPage && hasAnyToken) {
      const session = await getVerifiedUser(request);
      if (session?.uid) {
        const response = NextResponse.next();
        response.headers.set("x-user-id", session.uid);
        return response;
      }

      const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
      clearAuthCookies(response);
      response.cookies.set(REDIRECT_URL_COOKIE_NAME, pathname, {
        sameSite: "lax",
        path: COOKIE_PATH,
      });
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    logger.error("Proxy error:", error);
    return clearAuthCookies(
      NextResponse.redirect(new URL(ROUTES.home, request.url))
    );
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


