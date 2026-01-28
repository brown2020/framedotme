import { useEffect, useRef } from "react";
import { useAuthStore } from "./useAuthStore";
import useProfileStore from "./useProfileStore";

/**
 * Initializes stores that depend on auth state
 * Optimized to only fetch profile once per user session
 */
export const useInitializeStores = () => {
  const uid = useAuthStore((state) => state.uid);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const lastFetchedUidRef = useRef<string>("");

  useEffect(() => {
    // Only fetch if we have a uid and haven't fetched for this user yet
    if (!uid || lastFetchedUidRef.current === uid) return;
    
    lastFetchedUidRef.current = uid;
    
    // Fire-and-forget: fetchProfile handles its own errors internally
    // Read auth context at fetch time (not on every render) to avoid extra subscriptions
    const authState = useAuthStore.getState();
    void fetchProfile(uid, {
      authEmail: authState.authEmail,
      authDisplayName: authState.authDisplayName,
      authPhotoUrl: authState.authPhotoUrl,
      authEmailVerified: authState.authEmailVerified,
    });
  }, [uid, fetchProfile]);
};
