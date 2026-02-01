import { logger } from "@/utils/logger";
import { getClientCsrfToken, CSRF_HEADER_NAME } from "@/lib/security/csrf";

/**
 * Session cookie management service
 * Handles server-side httpOnly session cookie operations
 */

/**
 * Sets the server-side httpOnly session cookie
 * @param idToken - Firebase ID token to exchange for session cookie
 */
export async function setServerSessionCookie(idToken: string): Promise<void> {
  try {
    // Include CSRF token if available (for token refresh, not initial login)
    const csrfToken = getClientCsrfToken();
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    await fetch("/api/session", {
      method: "POST",
      headers,
      body: JSON.stringify({ idToken }),
    });
  } catch (error: unknown) {
    logger.error("Failed to set session cookie", error);
    throw error;
  }
}

/**
 * Clears the server-side httpOnly session cookie
 */
export async function clearServerSessionCookie(): Promise<void> {
  try {
    // Include CSRF token for DELETE request
    const csrfToken = getClientCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }

    await fetch("/api/session", {
      method: "DELETE",
      headers,
    });
  } catch {
    // Session cleanup is non-critical; user is already signed out locally
  }
}
