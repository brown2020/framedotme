/**
 * Simple logging utility with environment-based filtering
 * Checks environment once at module load for optimal performance
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Log level enablement configuration (computed once at module load) */
const ENABLED_LEVELS = {
  debug: !IS_PRODUCTION,
  info: !IS_PRODUCTION,
  warn: true,
  error: true,
} as const;

/**
 * Logs debug messages (development only)
 */
const debug = (message: string, ...args: unknown[]): void => {
  if (ENABLED_LEVELS.debug) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

/**
 * Logs info messages (development only)
 */
const info = (message: string, ...args: unknown[]): void => {
  if (ENABLED_LEVELS.info) {
    console.info(`[INFO] ${message}`, ...args);
  }
};

/**
 * Logs warning messages (all environments)
 */
const warn = (message: string, ...args: unknown[]): void => {
  if (ENABLED_LEVELS.warn) {
    console.warn(`[WARN] ${message}`, ...args);
  }
};

/**
 * Logs error messages (all environments)
 */
const error = (message: string, ...args: unknown[]): void => {
  if (ENABLED_LEVELS.error) {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

export const logger = {
  debug,
  info,
  warn,
  error,
};
