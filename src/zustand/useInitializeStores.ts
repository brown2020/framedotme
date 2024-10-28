import { useEffect } from "react";
import { useAuthStore } from "./useAuthStore";
import useProfileStore from "./useProfileStore";
import { useRecorderStatusStore } from "./useRecorderStatusStore";

let renderCount = 0;

export const useInitializeStores = () => {
  const uid = useAuthStore((state) => state.uid);

  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  const subscribeToFirestore = useRecorderStatusStore(
    (state) => state.subscribeToFirestore
  );

  console.log("useInitializeStores renderCount", renderCount++);

  useEffect(() => {
    if (!uid) return;

    fetchProfile();

    const unsubscribeFirestore = subscribeToFirestore();
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [fetchProfile, uid, subscribeToFirestore]);
};
