// zustand/useRecorderStatusStore.ts
import { create } from "zustand";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db } from "@/firebase/firebaseClient";
import React from "react";
import { RecorderStatusType } from "@/types/recorder";

interface RecorderStatusState {
  recorderStatus: RecorderStatusType;
  lastError: Error | null;
  isSubscribed: boolean;
  setRecorderStatus: (status: RecorderStatusType) => void;
  updateStatus: (newStatus: RecorderStatusType) => Promise<void>;
  subscribeToFirestore: () => (() => void) | void;
  setError: (error: Error | null) => void;
}

export const useRecorderStatusStore = create<RecorderStatusState>(
  (set, get) => ({
    recorderStatus: "idle",
    lastError: null,
    isSubscribed: false,

    setRecorderStatus: (status: RecorderStatusType) =>
      set({ recorderStatus: status }),

    setError: (error: Error | null) => set({ lastError: error }),

    updateStatus: async (newStatus: RecorderStatusType) => {
      const uid = useAuthStore.getState().uid;
      if (!uid) {
        set({ lastError: new Error("User not authenticated") });
        return;
      }

      try {
        const settings = {
          recorderStatus: newStatus,
          lastUpdated: new Date(),
        };

        const settingsRef = doc(db, `users/${uid}/settings/recorder`);
        await setDoc(settingsRef, settings, { merge: true });
        set({ recorderStatus: newStatus, lastError: null });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to update recorder status:", errorMessage);
        set({
          recorderStatus: "error",
          lastError: new Error(`Failed to update status: ${errorMessage}`),
        });
      }
    },

    subscribeToFirestore: () => {
      const uid = useAuthStore.getState().uid;
      if (!uid) {
        set({ lastError: new Error("User not authenticated") });
        return;
      }

      // Don't subscribe if already subscribed
      if (get().isSubscribed) return;

      const settingsRef = doc(db, `users/${uid}/settings/recorder`);

      const unsubscribe = onSnapshot(
        settingsRef,
        (doc) => {
          const data = doc.data();
          if (data?.recorderStatus) {
            set({
              recorderStatus: data.recorderStatus,
              lastError: null,
              isSubscribed: true,
            });
          }
        },
        (error) => {
          console.error("Firestore subscription error:", error);
          set({
            recorderStatus: "error",
            lastError: error as Error,
            isSubscribed: false,
          });
        }
      );

      return unsubscribe;
    },
  })
);

// Create a React hook for managing the Firestore subscription
export const useRecorderStatusSubscription = () => {
  const { subscribeToFirestore } = useRecorderStatusStore();

  React.useEffect(() => {
    const unsubscribe = subscribeToFirestore();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [subscribeToFirestore]);
};
