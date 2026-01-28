import { logger } from "@/utils/logger";

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
    await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
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
    await fetch("/api/session", { method: "DELETE" });
  } catch {
    // Session cleanup is non-critical; user is already signed out locally
  }
}
