export const RECORDER_POPUP_BLOCKED =
  "The recorder window was blocked. Allow popups for this site, or open the recorder in this tab.";

export const RECORDER_POPUP_CLOSED =
  "The recorder window was closed before screen sharing started. Open the recorder and try again.";

export const RECORDER_SHARE_ENDED =
  "Screen sharing stopped before recording started. Click Initialize Recording and choose a screen, window, or tab.";

/**
 * Ignore a Firestore snapshot that is older than the status already shown.
 * A late "idle" write must not clear an error the user is looking at.
 */
export function shouldApplyRemoteStatus(localUpdatedAt: number, remoteUpdatedAt: number): boolean {
  if (localUpdatedAt <= 0) return true;
  if (!remoteUpdatedAt) return false;
  return remoteUpdatedAt >= localUpdatedAt;
}

export function remoteUpdatedAtMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === "function") {
      const millis = toMillis.call(value);
      return typeof millis === "number" ? millis : 0;
    }
  }
  return 0;
}
