import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES, SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifyIdToken, verifySessionToken } from "@/lib/session";

const LEGACY_ID_TOKEN_COOKIE_NAME = "authToken";
const REDIRECT_COOKIE_NAME = "redirect_url";

function isAuthPage(pathname: string) {
  return pathname === ROUTES.home || pathname.startsWith(ROUTES.loginFinish);
}

async function getVerifiedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) return verifySessionToken(sessionCookie);

  const legacyIdToken = request.cookies.get(LEGACY_ID_TOKEN_COOKIE_NAME)?.value;
  if (legacyIdToken) return verifyIdToken(legacyIdToken);

  return null;
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const onAuthPage = isAuthPage(pathname);

    const hasAnyToken =
      Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value) ||
      Boolean(request.cookies.get(LEGACY_ID_TOKEN_COOKIE_NAME)?.value);

    // If on auth page and user looks authenticated, verify and redirect into the app
    if (onAuthPage && hasAnyToken) {
      const session = await getVerifiedUser(request);
      if (session?.uid) {
        return NextResponse.redirect(new URL(ROUTES.capture, request.url));
      }

      // Invalid token on auth page: allow but clear cookies
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(LEGACY_ID_TOKEN_COOKIE_NAME);
      return response;
    }

    // If on protected page and no token at all, redirect to auth
    if (!onAuthPage && !hasAnyToken) {
      const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
      response.cookies.set(REDIRECT_COOKIE_NAME, pathname, { sameSite: "lax" });
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
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(LEGACY_ID_TOKEN_COOKIE_NAME);
      response.cookies.set(REDIRECT_COOKIE_NAME, pathname, { sameSite: "lax" });
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy error:", error);
    const response = NextResponse.redirect(new URL(ROUTES.home, request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(LEGACY_ID_TOKEN_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    // Auth routes
    "/",
    "/loginfinish",
    // Protected routes
    "/capture/:path*",
    "/recordings/:path*",
    "/profile/:path*",
  ],
};


