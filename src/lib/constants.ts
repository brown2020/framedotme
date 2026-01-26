export const SESSION_COOKIE_NAME = "frame_session";
export const LEGACY_ID_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_COOKIE_NAME ?? "authToken";
export const REDIRECT_URL_COOKIE_NAME = "redirect_url";

export const ROUTES = {
  home: "/",
  capture: "/capture",
  recordings: "/recordings",
  profile: "/profile",
  loginFinish: "/loginfinish",
} as const;

// Credits
export const DEFAULT_CREDITS = 1000;
export const CREDITS_THRESHOLD = 100;

// Recording
export const RECORDING_CHUNK_INTERVAL_MS = 60 * 1000; // 1 minute
export const MAX_RECORDING_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

// Authentication
export const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
export const TOKEN_REFRESH_DEBOUNCE_MS = 1000;
