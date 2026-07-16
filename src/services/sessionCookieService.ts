import { logger } from "@/utils/logger";
import { getClientCsrfToken, CSRF_HEADER_NAME } from "@/lib/security/csrf";

/**
 * Session cookie management service
 * Handles server-side httpOnly session cookie operations
 */

async function ensureClientCsrfToken(): Promise<string> {
  const existingToken = getClientCsrfToken();
  if (existingToken) return existingToken;

  const response = await fetch("/api/session", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`CSRF bootstrap request failed: ${response.status}`);
  }

  const token = getClientCsrfToken();
  if (!token) {
    throw new Error("CSRF bootstrap did not set a token");
  }
  return token;
}

/**
 * Sets the server-side httpOnly session cookie
 * @param idToken - Firebase ID token to exchange for session cookie
 */
export async function setServerSessionCookie(idToken: string): Promise<void> {
  try {
    const csrfToken = await ensureClientCsrfToken();
    const headers: Record<string, string> = {
      "content-type": "application/json",
      [CSRF_HEADER_NAME]: csrfToken,
    };

    const response = await fetch("/api/session", {
      method: "POST",
      headers,
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      throw new Error(`Session cookie request failed: ${response.status}`);
    }
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
    const csrfToken = await ensureClientCsrfToken();
    const headers: Record<string, string> = {
      [CSRF_HEADER_NAME]: csrfToken,
    };

    const response = await fetch("/api/session", {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      throw new Error(`Session cleanup request failed: ${response.status}`);
    }
  } catch {
    // Session cleanup is non-critical; user is already signed out locally
  }
}
