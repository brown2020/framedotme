// src/stores/useRecorderStatusStore.js
import { create } from "zustand";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db } from "@/firebase/firebaseClient";

type RecorderStatusType =
  | "idle"
  | "ready"
  | "shouldStart"
  | "shouldStop"
  | "starting"
  | "recording"
  | "saving"
  | "error"
  | "unknown";

interface RecorderStatusState {
  recorderStatus: RecorderStatusType;
  setRecorderStatus: (status: RecorderStatusType) => void;
  updateStatus: (newStatus: RecorderStatusType) => Promise<void>;
  subscribeToFirestore: () => (() => void) | void;
}

export const useRecorderStatusStore = create<RecorderStatusState>((set) => ({
  recorderStatus: "idle",

  setRecorderStatus: (status: RecorderStatusType) =>
    set({ recorderStatus: status }),

  updateStatus: async (newStatus: RecorderStatusType) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    try {
      const settingsRef = doc(db, `users/${uid}/settings/recorder`);
      await setDoc(settingsRef, { recorderStatus: newStatus }, { merge: true });
      set({ recorderStatus: newStatus });
    } catch (error) {
      console.error("Failed to update recorder status:", error);
      set({ recorderStatus: "error" }); // Set to error status on failure
    }
  },

  subscribeToFirestore: () => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    const settingsRef = doc(db, `users/${uid}/settings/recorder`);

    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      const data = doc.data();
      if (data?.recorderStatus) {
        set({ recorderStatus: data.recorderStatus });
      }
    });

    return unsubscribe; // Return the unsubscribe function to clean up listeners
  },
}));
