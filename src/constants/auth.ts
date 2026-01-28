/**
 * Authentication and session constants
 */

// Cookies
// Two-cookie auth strategy:
// - SESSION_COOKIE_NAME: httpOnly cookie for server-side auth (middleware/API routes)
// - CLIENT_ID_TOKEN_COOKIE_NAME: JavaScript-readable cookie for Firebase client SDK
// Note: NEXT_PUBLIC_COOKIE_NAME is validated in firebaseClient.ts at startup
export const SESSION_COOKIE_NAME = "frame_session";
export const CLIENT_ID_TOKEN_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME!;
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

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

/**
 * Generates a token refresh storage key for a given cookie name
 * Used for cross-tab token refresh synchronization
 * 
 * @param cookieName - The cookie name to generate a key for
 * @returns The storage key for token refresh tracking
 */
export function getTokenRefreshKey(cookieName: string): string {
  return `lastTokenRefresh_${cookieName}`;
}
