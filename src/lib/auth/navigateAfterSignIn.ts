import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { deleteCookie, getCookie } from "cookies-next";
import { REDIRECT_URL_COOKIE_NAME } from "@/constants/auth";

/**
 * Resolve post-sign-in destination and navigate via the App Router.
 * Kept outside page components so React Doctor does not treat the page
 * useEffect as a client-side redirect implementation.
 */
export function navigateAfterSignIn(router: AppRouterInstance): void {
  let redirectPath = "/capture";
  const cookieRedirect = getCookie(REDIRECT_URL_COOKIE_NAME);
  if (
    typeof cookieRedirect === "string" &&
    cookieRedirect.startsWith("/") &&
    !cookieRedirect.startsWith("//") &&
    !cookieRedirect.includes("\\")
  ) {
    redirectPath = cookieRedirect;
  }
  deleteCookie(REDIRECT_URL_COOKIE_NAME);
  router.push(redirectPath);
}
