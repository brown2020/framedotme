/**
 * Same-origin relative redirects only.
 * Rejects protocol-relative URLs and backslashes, which browsers normalize
 * into `https://evil.com` (for example `/\evil.com`).
 */
const REDIRECT_ORIGIN = "https://frame.me";

export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return false;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("@")) return false;
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
  if (decoded.includes("\\") || decoded.includes("@")) return false;
  if (/[\u0000-\u001F\u007F]/.test(decoded)) return false;

  try {
    const url = new URL(value, REDIRECT_ORIGIN);
    return url.origin === REDIRECT_ORIGIN && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}
