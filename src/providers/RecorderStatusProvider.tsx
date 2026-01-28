import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { useAuthStore } from "@/zustand/useAuthStore";
import { subscribeToRecorderStatus } from "@/services/recorderStatusService";

export function RecorderStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { setRecorderStatus, setError } = useRecorderStatusStore();
  const { uid, authReady } = useAuthStore();

  useEffect(() => {
    if (!authReady || !uid) {
      return;
    }

    const unsubscribe = subscribeToRecorderStatus(
      uid,
      (status) => setRecorderStatus(status, true),
      (error) => setError(error)
    );

    return () => {
      unsubscribe();
    };
  }, [uid, authReady, setRecorderStatus, setError]);

  return <>{children}</>;
}
