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
