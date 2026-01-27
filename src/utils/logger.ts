/**
 * Simple logging utility with environment-based filtering
 * Checks environment once at module load for optimal performance
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ENABLE_DEBUG = !IS_PRODUCTION;
const ENABLE_INFO = !IS_PRODUCTION;

/**
 * Logs debug messages (development only)
 */
function debug(message: string, ...args: unknown[]): void {
  if (ENABLE_DEBUG) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Logs info messages (development only)
 */
function info(message: string, ...args: unknown[]): void {
  if (ENABLE_INFO) {
    console.info(`[INFO] ${message}`, ...args);
  }
}

/**
 * Logs warning messages (all environments)
 */
function warn(message: string, ...args: unknown[]): void {
  console.warn(`[WARN] ${message}`, ...args);
}

/**
 * Logs error messages (all environments)
 */
function error(message: string, ...args: unknown[]): void {
  console.error(`[ERROR] ${message}`, ...args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
