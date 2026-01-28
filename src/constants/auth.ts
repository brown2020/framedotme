/**
 * Authentication and session constants
 */

// Cookies
// Two-cookie auth strategy:
// - SESSION_COOKIE_NAME: httpOnly cookie for server-side auth (middleware/API routes)
// - CLIENT_ID_TOKEN_COOKIE_NAME: JavaScript-readable cookie for Firebase client SDK
export const SESSION_COOKIE_NAME = "frame_session";
export const CLIENT_ID_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME || "";
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Validate CLIENT_ID_TOKEN_COOKIE_NAME is set (checked at module load)
if (!CLIENT_ID_TOKEN_COOKIE_NAME) {
  throw new Error("Missing required NEXT_PUBLIC_COOKIE_NAME environment variable. Check your .env file");
}

// Token refresh
// Refresh tokens every 50 minutes (10 minutes before Firebase's 1-hour token expiry)
// This ensures tokens are always valid for server-side authentication
export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
export const TOKEN_REFRESH_DEBOUNCE_MS = 1000; // 1 second debounce for cross-tab sync

// Auth pending timeout
export const AUTH_PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Browser storage keys for auth data
export const AUTH_STORAGE_KEYS = {
  EMAIL: "frameEmail",
  NAME: "frameName",
} as const;

// Token refresh storage key prefix
export const TOKEN_REFRESH_KEY_PREFIX = "lastTokenRefresh_";
