// Cookies
export const SESSION_COOKIE_NAME = "frame_session";
export const LEGACY_ID_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_COOKIE_NAME ?? "authToken";
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Routes
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

// Credits
export const DEFAULT_CREDITS = 1000;
export const CREDITS_THRESHOLD = 100;
export const BONUS_CREDITS = 1;

// Recording
export const RECORDING_CHUNK_INTERVAL_MS = 60 * 1000; // 1 minute
export const MAX_RECORDING_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
export const RECORDING_FRAME_RATE = 30;
export const RECORDING_MIME_TYPE = "video/webm;codecs=vp8,opus";

// Authentication
export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
export const TOKEN_REFRESH_DEBOUNCE_MS = 1000;

// UI Constants
export const VIDEO_DIMENSION_UPDATE_INTERVAL_MS = 500;
export const DEFAULT_VIDEO_WIDTH = 512;
export const DEFAULT_VIDEO_HEIGHT = 512;

// Video Controls Window
export const VIDEO_CONTROLS_WINDOW_WIDTH = 400;
export const VIDEO_CONTROLS_WINDOW_HEIGHT = 660;
export const VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS = 500;

// Download Utils
export const DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS = 100;

// Z-Index Layers
export const Z_INDEX = {
  modal: 1000,
  header: 10,
} as const;

// Payment
export const DEFAULT_PAYMENT_AMOUNT = 99.99;
export const DEFAULT_PAYMENT_CURRENCY = "usd";

// Company Info
export const COMPANY_INFO = {
  name: "Frame.me",
  email: "support@frame.me",
  website: "https://frame.me",
  address: "123 Main St, San Francisco, CA 94105",
} as const;
