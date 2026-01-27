import { create } from "zustand";
import { RecorderStatusType } from "@/types/recorder";

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

// Selectors for optimized re-renders
export const useRecorderStatus = () => useRecorderStatusStore((state) => state.recorderStatus);
export const useRecorderError = () => useRecorderStatusStore((state) => state.lastError);
