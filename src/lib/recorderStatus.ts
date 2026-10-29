import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { updateRecorderStatus } from "@/services/recorderStatusService";
import { logger } from "@/utils/logger";

export {
  RECORDER_POPUP_BLOCKED,
  RECORDER_POPUP_CLOSED,
  RECORDER_SHARE_ENDED,
  shouldApplyRemoteStatus,
  remoteUpdatedAtMillis,
} from "@/lib/recorderStatusTime";

const RECORDER_CHANNEL = "frameme-recorder-status";

type RecorderBroadcast = {
  status: string;
  message: string | null;
  updatedAt: number;
};

function broadcastRecorderStatus(update: RecorderBroadcast): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(RECORDER_CHANNEL);
  channel.postMessage(update);
  channel.close();
}

function syncRecorderStatus(
  status: "idle" | "ready" | "shouldStart" | "shouldStop" | "starting" | "recording" | "saving" | "error" | "unknown",
  message: string | null,
  updatedAt: number,
): void {
  const uid = useAuthStore.getState().uid;
  if (!uid) return;
  void updateRecorderStatus(uid, status, message, updatedAt).catch((error) => {
    logger.error("Failed to sync recorder status", error);
  });
}

/** Update this window, the capture page, and Firestore. */
export function publishRecorderStatus(
  status: "idle" | "ready" | "shouldStart" | "shouldStop" | "starting" | "recording" | "saving" | "error" | "unknown",
  message: string | null = null,
): void {
  if (status === "error") {
    const text = message || "Screen sharing could not start. Please try again.";
    const updatedAt = useRecorderStatusStore.getState().reportFailure(text);
    const update = { status, message: text, updatedAt };
    broadcastRecorderStatus(update);
    syncRecorderStatus(status, text, updatedAt);
    return;
  }

  useRecorderStatusStore.getState().setRecorderStatus(status);
  const updatedAt = useRecorderStatusStore.getState().localUpdatedAt;
  const update = { status, message: null, updatedAt };
  broadcastRecorderStatus(update);
  syncRecorderStatus(status, null, updatedAt);
}

export function subscribeRecorderStatus(
  onUpdate: (update: RecorderBroadcast) => void,
): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(RECORDER_CHANNEL);
  channel.onmessage = (event: MessageEvent<RecorderBroadcast>) => {
    if (!event.data || typeof event.data.status !== "string") return;
    onUpdate(event.data);
  };
  return () => channel.close();
}

/** Show a recorder failure in this window and on /capture. */
export function reportRecorderFailure(message: string): void {
  publishRecorderStatus("error", message);
}
