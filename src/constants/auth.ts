/**
 * Authentication and session constants
 */

// Validate required environment variables at module load
if (!process.env.NEXT_PUBLIC_COOKIE_NAME) {
  throw new Error("NEXT_PUBLIC_COOKIE_NAME environment variable is required");
}

// Cookies
// Two-cookie auth strategy:
// - SESSION_COOKIE_NAME: httpOnly cookie for server-side auth (middleware/API routes)
// - CLIENT_ID_TOKEN_COOKIE_NAME: JavaScript-readable cookie for Firebase client SDK
export const SESSION_COOKIE_NAME = "frame_session";
export const CLIENT_ID_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME;
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Token refresh
export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
export const TOKEN_REFRESH_DEBOUNCE_MS = 1000;

// Auth pending timeout
export const AUTH_PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Browser storage keys for auth data
export const AUTH_STORAGE_KEYS = {
  EMAIL: "frameEmail",
  NAME: "frameName",
  TOKEN_REFRESH: (cookieName: string) => `lastTokenRefresh_${cookieName}`,
} as const;
