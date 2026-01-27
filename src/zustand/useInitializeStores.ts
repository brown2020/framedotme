import { useEffect, useRef } from "react";
import {
  useAuthUid,
  useAuthEmail,
  useAuthDisplayName,
  useAuthPhotoUrl,
  useAuthEmailVerified,
} from "./useAuthStore";
import useProfileStore from "./useProfileStore";

/**
 * Initializes stores that depend on auth state
 * Optimized to only fetch profile once per user session
 */
export const useInitializeStores = () => {
  const uid = useAuthUid();
  const authEmail = useAuthEmail();
  const authDisplayName = useAuthDisplayName();
  const authPhotoUrl = useAuthPhotoUrl();
  const authEmailVerified = useAuthEmailVerified();
  
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const lastFetchedUidRef = useRef<string>("");

  useEffect(() => {
    // Only fetch if we have a uid and haven't fetched for this user yet
    if (!uid || lastFetchedUidRef.current === uid) return;
    
    lastFetchedUidRef.current = uid;
    
    fetchProfile(uid, {
      authEmail,
      authDisplayName,
      authPhotoUrl,
      authEmailVerified,
    });
  }, [uid, authEmail, authDisplayName, authPhotoUrl, authEmailVerified, fetchProfile]);
};
