/**
 * Environment variable access helpers for SERVER-SIDE code
 * 
 * WARNING: DO NOT use these helpers for NEXT_PUBLIC_* variables!
 * Next.js requires NEXT_PUBLIC_* variables to be accessed directly (statically)
 * for build-time replacement. Dynamic access breaks this:
 * 
 * ✅ CORRECT:   const apiKey = process.env.NEXT_PUBLIC_API_KEY;
 * ❌ INCORRECT: const apiKey = getRequiredEnv("NEXT_PUBLIC_API_KEY");
 * 
 * These helpers are ONLY for server-side environment variables (no NEXT_PUBLIC_ prefix)
 * such as API secrets, database credentials, etc.
 */

/**
 * Gets a required server-side environment variable
 * Throws error if variable is missing or empty
 * 
 * @param key - Environment variable name (server-side only, NOT NEXT_PUBLIC_*)
 * @returns The environment variable value
 * @throws {Error} If variable is missing or empty
 * 
 * @example
 * // ✅ Good - server-side variable
 * const dbUrl = getRequiredEnv("DATABASE_URL");
 * const secret = getRequiredEnv("FIREBASE_PRIVATE_KEY");
 * 
 * // ❌ Bad - breaks Next.js static replacement
 * const apiKey = getRequiredEnv("NEXT_PUBLIC_API_KEY");
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional server-side environment variable with fallback
 * 
 * @param key - Environment variable name (server-side only, NOT NEXT_PUBLIC_*)
 * @param defaultValue - Default value if variable is missing (defaults to empty string)
 * @returns The environment variable value or default
 */
export function getOptionalEnv(key: string, defaultValue = ""): string {
  return process.env[key] || defaultValue;
}
