/**
 * Simple logging utility with environment-based filtering
 * Environment checked once at module load for optimal performance
 */

const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

/**
 * Logs debug messages (development only)
 */
const debug = (message: string, ...args: unknown[]): void => {
  if (IS_DEVELOPMENT) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

/**
 * Logs info messages (development only)
 */
const info = (message: string, ...args: unknown[]): void => {
  if (IS_DEVELOPMENT) {
    console.info(`[INFO] ${message}`, ...args);
  }
};

/**
 * Logs warning messages (all environments)
 */
const warn = (message: string, ...args: unknown[]): void => {
  console.warn(`[WARN] ${message}`, ...args);
};

/**
 * Logs error messages (all environments)
 */
const error = (message: string, ...args: unknown[]): void => {
  console.error(`[ERROR] ${message}`, ...args);
};

export const logger = {
  debug,
  info,
  warn,
  error,
};
