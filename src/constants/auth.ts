/**
 * Authentication and session constants
 */

// Cookies
// Two-cookie auth strategy:
// - SESSION_COOKIE_NAME: httpOnly cookie for server-side auth (middleware/API routes)
// - CLIENT_ID_TOKEN_COOKIE_NAME: JavaScript-readable cookie for Firebase client SDK
export const SESSION_COOKIE_NAME = "frame_session";
export const CLIENT_ID_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_COOKIE_NAME ?? "authToken";
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Token refresh
export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
export const TOKEN_REFRESH_DEBOUNCE_MS = 1000;
