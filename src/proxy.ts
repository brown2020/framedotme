/**
 * Next.js 16 proxy. Runs on the Node.js runtime.
 *
 * The session cookie is minted by /api/session after Firebase authentication.
 * Each request checks the JWT signature and that the token id is still in the
 * server session registry. Firestore rules remain the data-access boundary.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./constants/config";
import { verifyAppSession } from "@/services/sessionRegistry";

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

const PAYMENT_ROUTES = [ROUTES.paymentAttempt, ROUTES.paymentSuccess] as const;

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

function isPaymentRoute(path: string): boolean {
  return PAYMENT_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
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
    const session = sessionToken ? await verifyAppSession(sessionToken) : null;
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
      // Email-link completion must run even when a session cookie already exists.
      if (pathname === ROUTES.loginFinish) {
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

      if (isPaymentRoute(pathname) && !session.emailVerified) {
        const response = NextResponse.redirect(
          new URL("/profile?notice=verify-email", request.url),
        );
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
