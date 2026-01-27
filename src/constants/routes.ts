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
