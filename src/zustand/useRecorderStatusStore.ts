import { create } from "zustand";
import type { RecorderStatusType } from "@/types/recorder";
import { shouldApplyRemoteStatus } from "@/lib/recorderStatusTime";

interface RecorderStatusState {
  recorderStatus: RecorderStatusType;
  statusMessage: string | null;
  localUpdatedAt: number;
  lastError: Error | null;
  isUpdatingFromFirestore: boolean;
  setRecorderStatus: (status: RecorderStatusType, fromFirestore?: boolean) => void;
  reportFailure: (message: string) => number;
  applyRemoteRecorderStatus: (update: {
    status: RecorderStatusType;
    message: string | null;
    updatedAt: number;
  }) => void;
  setError: (error: Error | null) => void;
}

export const useRecorderStatusStore = create<RecorderStatusState>((set) => ({
  recorderStatus: "idle",
  statusMessage: null,
  localUpdatedAt: 0,
  lastError: null,
  isUpdatingFromFirestore: false,

  setRecorderStatus: (status: RecorderStatusType, fromFirestore = false) =>
    set((state) => ({
      recorderStatus: status,
      statusMessage: status === "error" ? state.statusMessage : null,
      lastError: status === "error" ? state.lastError : null,
      isUpdatingFromFirestore: fromFirestore,
      localUpdatedAt: fromFirestore ? state.localUpdatedAt : Date.now(),
    })),

  reportFailure: (message: string) => {
    const updatedAt = Date.now();
    set({
      recorderStatus: "error",
      statusMessage: message,
      lastError: new Error(message),
      isUpdatingFromFirestore: false,
      localUpdatedAt: updatedAt,
    });
    return updatedAt;
  },

  applyRemoteRecorderStatus: ({ status, message, updatedAt }) =>
    set((state) => {
      if (!shouldApplyRemoteStatus(state.localUpdatedAt, updatedAt)) return state;
      return {
        recorderStatus: status,
        statusMessage: status === "error" ? message : null,
        lastError: status === "error" && message ? new Error(message) : null,
        isUpdatingFromFirestore: true,
        localUpdatedAt: Math.max(state.localUpdatedAt, updatedAt),
      };
    }),

  setError: (error: Error | null) => set({ lastError: error }),
}));
