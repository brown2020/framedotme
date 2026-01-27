/**
 * Error handling utilities
 * Re-exports from specialized modules for backward compatibility
 * 
 * Prefer importing directly from errorFormatters or errorNotifications
 * when possible for better code organization
 */

// Pure formatting functions (no side effects)
export {
  getErrorMessage,
  logError,
} from "./errorFormatters";

// UI notification functions (toast displays)
export {
  showErrorToast,
  handleError,
} from "./errorNotifications";
