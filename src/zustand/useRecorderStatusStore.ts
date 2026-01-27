import { create } from "zustand";
import type { RecorderStatusType } from "@/types/recorder";

interface RecorderStatusState {
  recorderStatus: RecorderStatusType;
  lastError: Error | null;
  isUpdatingFromFirestore: boolean;
  setRecorderStatus: (status: RecorderStatusType, fromFirestore?: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useRecorderStatusStore = create<RecorderStatusState>((set) => ({
  recorderStatus: "idle",
  lastError: null,
  isUpdatingFromFirestore: false,

  setRecorderStatus: (status: RecorderStatusType, fromFirestore = false) =>
    set({ recorderStatus: status, isUpdatingFromFirestore: fromFirestore }),

  setError: (error: Error | null) => set({ lastError: error }),
}));

/**
 * Optimized selectors for recorder state
 * Use these instead of directly accessing the store to prevent unnecessary re-renders
 */

// Individual recorder properties
export const useRecorderStatus = () => useRecorderStatusStore((state) => state.recorderStatus);
export const useRecorderError = () => useRecorderStatusStore((state) => state.lastError);

// Grouped selector for complete recorder state
export const useRecorderState = () => useRecorderStatusStore((state) => ({
  status: state.recorderStatus,
  error: state.lastError,
}));
