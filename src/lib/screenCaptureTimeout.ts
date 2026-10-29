import { MediaStreamError } from "@/types/mediaStreamTypes";

export const SCREEN_CAPTURE_TIMEOUT_MS = 15_000;

export const SCREEN_CAPTURE_TIMEOUT_MESSAGE =
  "Screen capture did not start; check browser permissions.";

/**
 * Reject when getDisplayMedia never settles. A browser with no screen picker
 * leaves the promise pending instead of throwing NotAllowedError.
 */
export function withScreenCaptureTimeout<T>(
  promise: Promise<T>,
  timeoutMs = SCREEN_CAPTURE_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new MediaStreamError(SCREEN_CAPTURE_TIMEOUT_MESSAGE, "permission"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
