import { create } from "zustand";
import type { RecorderStatusType } from "@/types/recorder";

interface RecorderStatusState {
  recorderStatus: RecorderStatusType;
  lastError: Error | null;
  setRecorderStatus: (status: RecorderStatusType) => void;
  setError: (error: Error | null) => void;
}

export const useRecorderStatusStore = create<RecorderStatusState>((set) => ({
  recorderStatus: "idle",
  lastError: null,

  setRecorderStatus: (status: RecorderStatusType) =>
    set({ recorderStatus: status }),

  setError: (error: Error | null) => set({ lastError: error }),
}));

/**
 * Optimized selectors for recorder state
 */
export const useRecorderStatus = () => useRecorderStatusStore((state) => state.recorderStatus);
export const useRecorderError = () => useRecorderStatusStore((state) => state.lastError);

// Grouped selector for complete recorder state
export const useRecorderState = () => useRecorderStatusStore((state) => ({
  status: state.recorderStatus,
  error: state.lastError,
}));
