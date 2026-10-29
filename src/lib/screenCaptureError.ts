export type ScreenCaptureEnv = {
  isSecureContext: boolean;
  hasGetDisplayMedia: boolean;
};

/** Browser facts used to explain why screen capture cannot start. */
export function readScreenCaptureEnv(): ScreenCaptureEnv {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isSecureContext: true, hasGetDisplayMedia: true };
  }
  return {
    isSecureContext: window.isSecureContext,
    hasGetDisplayMedia: typeof navigator.mediaDevices?.getDisplayMedia === "function",
  };
}

/**
 * Message to show before calling getDisplayMedia, or null when the page can try.
 */
export function screenCaptureUnavailableMessage(
  env: ScreenCaptureEnv = readScreenCaptureEnv(),
): string | null {
  if (!env.isSecureContext) {
    return "Screen sharing only works on a secure HTTPS page. Open this site in a normal browser window and try again.";
  }
  if (!env.hasGetDisplayMedia) {
    return "Screen sharing is not supported in this browser. Use a current Chrome, Edge, or other Chromium-based browser.";
  }
  return null;
}

/** User-facing copy for a failed getDisplayMedia call. Never returns an empty string. */
export function screenCaptureFailureMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Screen sharing was canceled or blocked. Click Initialize Recording and choose a screen, window, or tab.";
    case "InvalidStateError":
      return "Screen sharing must be started from the Initialize Recording button.";
    case "NotFoundError":
      return "No screen, window, or browser tab is available to share.";
    case "NotReadableError":
    case "AbortError":
    case "TrackStartError":
      return "The selected screen could not be captured. Check your browser and system screen-recording permissions, then try again.";
    case "NotSupportedError":
    case "OverconstrainedError":
      return "This browser could not start screen sharing with the requested settings. Try a current Chrome or Edge window.";
    case "SecurityError":
      return "This page is not allowed to capture the screen. Open the recorder in its own tab on this site and try again.";
    case "TypeError":
      return "Screen sharing is not available in this browser. Use a current Chrome, Edge, or other Chromium-based browser.";
    case "ScreenCaptureTimeout":
      return "Screen capture did not start; check browser permissions.";
    default:
      return "Screen sharing could not start. Please try again.";
  }
}
