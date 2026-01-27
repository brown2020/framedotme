/**
 * Central constants export file
 * Re-exports from domain-specific constant files for backward compatibility
 * 
 * Prefer importing from domain-specific files (e.g., @/constants/routes)
 * when possible for better code organization
 */

// Auth constants
export {
  SESSION_COOKIE_NAME,
  LEGACY_ID_TOKEN_COOKIE_NAME,
  REDIRECT_URL_COOKIE_NAME,
  SESSION_EXPIRES_IN_MS,
  TOKEN_REFRESH_INTERVAL_MS,
  TOKEN_REFRESH_DEBOUNCE_MS,
} from "@/constants/auth";

// Route constants
export { ROUTES } from "@/constants/routes";

// Payment and credit constants
export {
  DEFAULT_CREDITS,
  CREDITS_THRESHOLD,
  BONUS_CREDITS,
  DEFAULT_PAYMENT_AMOUNT,
  DEFAULT_PAYMENT_CURRENCY,
} from "@/constants/payment";

// Recording constants
export {
  RECORDING_CHUNK_INTERVAL_MS,
  MAX_RECORDING_FILE_SIZE,
  RECORDING_FRAME_RATE,
  RECORDING_MIME_TYPE,
  VIDEO_DIMENSION_UPDATE_INTERVAL_MS,
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  VIDEO_CONTROLS_WINDOW_WIDTH,
  VIDEO_CONTROLS_WINDOW_HEIGHT,
  VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS,
  DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS,
} from "@/constants/recording";

// UI constants
export { Z_INDEX } from "@/constants/ui";

// Company info
export { COMPANY_INFO } from "@/constants/company";
