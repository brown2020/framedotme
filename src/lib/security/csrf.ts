/**
 * CSRF Protection Utility
 *
 * Implements the Double Submit Cookie pattern for CSRF protection:
 * 1. Generate a random CSRF token
 * 2. Store it in a cookie (csrf-token) that's readable by JavaScript
 * 3. Client includes the token in request headers (X-CSRF-Token)
 * 4. Server verifies the header matches the cookie
 *
 * This works because:
 * - Attackers can't read cookies from other domains (Same-Origin Policy)
 * - Attackers can't set custom headers for cross-origin requests
 * - So only legitimate requests will have matching token values
 *
 * @example
 * ```typescript
 * // In API route
 * export async function POST(request: Request) {
 *   const csrfResult = validateCsrfToken(request);
 *   if (!csrfResult.valid) {
 *     return NextResponse.json({ error: csrfResult.error }, { status: 403 });
 *   }
 *   // Continue with request handling
 * }
 *
 * // In client code
 * const csrfToken = getClientCsrfToken();
 * fetch('/api/session', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': csrfToken,
 *   },
 *   body: JSON.stringify({ idToken }),
 * });
 * ```
 */

import type { NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  // Use Web Crypto API for secure random bytes
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Result of CSRF token validation
 */
export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates CSRF token from request.
 *
 * Compares the token in the X-CSRF-Token header with the token in the csrf-token cookie.
 * Both must be present and match for the request to be considered valid.
 *
 * @param request - The incoming request to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateCsrfToken(request: Request): CsrfValidationResult {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return { valid: false, error: "Missing CSRF token header" };
  }

  // Get token from cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieToken = parseCookieValue(cookieHeader, CSRF_COOKIE_NAME);
  if (!cookieToken) {
    return { valid: false, error: "Missing CSRF token cookie" };
  }

  // Compare tokens using timing-safe comparison
  if (!timingSafeEqual(headerToken, cookieToken)) {
    return { valid: false, error: "Invalid CSRF token" };
  }

  return { valid: true };
}

/**
 * Sets the CSRF token cookie on a response.
 *
 * Call this when creating a new session to ensure the client has a CSRF token.
 *
 * @param response - The NextResponse to add the cookie to
 * @param token - The CSRF token to set (generates new one if not provided)
 * @returns The token that was set
 */
export function setCsrfTokenCookie(
  response: NextResponse,
  token?: string
): string {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return csrfToken;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Constant-time comparison even for different lengths
    let result = a.length ^ b.length;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i % b.length || 0);
    }
    return result === 0;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parses a specific cookie value from a cookie header string.
 *
 * @param cookieHeader - The raw Cookie header value
 * @param name - The name of the cookie to find
 * @returns The cookie value or null if not found
 */
function parseCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...cookieValueParts] = cookie.trim().split("=");
    if (cookieName === name) {
      return cookieValueParts.join("=");
    }
  }
  return null;
}

/**
 * Client-side helper to get CSRF token from cookie.
 *
 * This is intended for use in client-side code to retrieve the CSRF token
 * that should be included in request headers.
 *
 * @returns The CSRF token or empty string if not found
 */
export function getClientCsrfToken(): string {
  if (typeof document === "undefined") return "";

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return valueParts.join("=");
    }
  }
  return "";
}
