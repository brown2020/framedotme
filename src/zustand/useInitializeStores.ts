import { useEffect } from "react";
import { useAuthStore } from "./useAuthStore";
import useProfileStore from "./useProfileStore";

export const useInitializeStores = () => {
  const {
    uid,
    authEmail,
    authDisplayName,
    authPhotoUrl,
    authEmailVerified
  } = useAuthStore();
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!uid) return;
    
    fetchProfile(uid, {
      authEmail,
      authDisplayName,
      authPhotoUrl,
      authEmailVerified
    });
  }, [fetchProfile, uid, authEmail, authDisplayName, authPhotoUrl, authEmailVerified]);
};
