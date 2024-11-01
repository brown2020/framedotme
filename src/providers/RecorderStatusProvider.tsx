// components/providers/RecorderStatusProvider.tsx
import { useEffect } from "react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { useAuthStore } from "@/zustand/useAuthStore";

export function RecorderStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { subscribeToFirestore } = useRecorderStatusStore();
  const { uid, authReady } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | void;

    if (authReady && uid) {
      unsubscribe = subscribeToFirestore();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [uid, authReady, subscribeToFirestore]);

  // You could add loading states or error handling here if needed
  return <>{children}</>;
}
