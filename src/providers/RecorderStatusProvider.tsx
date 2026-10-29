import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { useAuthStore } from "@/zustand/useAuthStore";
import { subscribeToRecorderStatus } from "@/services/recorderStatusService";
import { subscribeRecorderStatus } from "@/lib/recorderStatus";
import type { RecorderStatusType } from "@/types/recorder";

export function RecorderStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { setError } = useRecorderStatusStore();
  const { uid, authReady } = useAuthStore();

  useEffect(() => {
    return subscribeRecorderStatus((update) => {
      useRecorderStatusStore.getState().applyRemoteRecorderStatus({
        status: update.status as RecorderStatusType,
        message: update.message,
        updatedAt: update.updatedAt,
      });
    });
  }, []);

  useEffect(() => {
    if (!authReady || !uid) {
      return;
    }

    const unsubscribe = subscribeToRecorderStatus(
      uid,
      (update) =>
        useRecorderStatusStore.getState().applyRemoteRecorderStatus(update),
      (error) => setError(error)
    );

    return () => {
      unsubscribe();
    };
  }, [uid, authReady, setError]);

  return <>{children}</>;
}
