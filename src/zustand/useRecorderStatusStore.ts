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
