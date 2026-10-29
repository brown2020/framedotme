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

/** Show a recorder failure in this window and sync it so the other window sees it too. */
export function reportRecorderFailure(message: string): void {
  const updatedAt = useRecorderStatusStore.getState().reportFailure(message);
  const uid = useAuthStore.getState().uid;
  if (!uid) return;
  void updateRecorderStatus(uid, "error", message, updatedAt).catch((error) => {
    logger.error("Failed to sync recorder error", error);
  });
}
