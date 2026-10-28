import { deleteCookie, getCookie } from "cookies-next";
import { REDIRECT_URL_COOKIE_NAME } from "@/constants/auth";
import { ROUTES } from "@/constants/config";
import { isSafeRedirectPath } from "@/lib/auth/safeRedirect";

export function resolvePostAuthPath(fallback = ROUTES.capture): string {
  const cookieRedirect = getCookie(REDIRECT_URL_COOKIE_NAME);
  if (isSafeRedirectPath(cookieRedirect)) {
    deleteCookie(REDIRECT_URL_COOKIE_NAME);
    return cookieRedirect;
  }
  return fallback;
}
