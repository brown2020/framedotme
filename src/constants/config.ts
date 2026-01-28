/**
 * Application-wide configuration constants
 * Consolidates routes, UI settings, and company information
 */

/**
 * Application route constants
 * Centralized route definitions to prevent typos and ensure consistency
 */
export const ROUTES = {
  home: "/",
  capture: "/capture",
  recordings: "/recordings",
  profile: "/profile",
  loginFinish: "/loginfinish",
  paymentAttempt: "/payment-attempt",
  paymentSuccess: "/payment-success",
  videoControls: "/videocontrols",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  support: "/support",
} as const;

/**
 * UI and styling constants
 * Z-Index layers to prevent conflicts and ensure proper stacking
 * 
 * Usage:
 * - base: Default layer for content
 * - header: Header component (fixed navigation)
 * - modal: AuthModal component
 * - dialog: ConfirmDialog component
 * - toast: Toast notifications (managed by react-hot-toast library)
 */
export const Z_INDEX = {
  base: 0,
  header: 10,
  modal: 1000,
  dialog: 1000,
  toast: 9999,
} as const;

/**
 * Company information constants
 */
export const COMPANY_INFO = {
  name: "Frame.me",
  email: "support@frame.me",
  website: "https://frame.me",
  address: "123 Main St, San Francisco, CA 94105",
} as const;
