import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { 
  fetchUserProfile, 
  saveUserProfile, 
  updateUserProfile, 
  deleteUserAccount 
} from "@/services/userService";
import { DEFAULT_CREDITS, CREDITS_THRESHOLD } from "@/lib/constants";
import { logError } from "@/utils/errorHandling";

export interface ProfileType {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
  fireworks_api_key: string;
  openai_api_key: string;
  stability_api_key: string;
  bria_api_key: string;
  did_api_key: string;
  replicate_api_key: string;
  selectedAvatar: string;
  selectedTalkingPhoto: string;
  useCredits: boolean;
  runway_ml_api_key: string;
}

const defaultProfile: ProfileType = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,
  fireworks_api_key: "",
  openai_api_key: "",
  stability_api_key: "",
  bria_api_key: "",
  did_api_key: "",
  replicate_api_key: "",
  selectedAvatar: "",
  selectedTalkingPhoto: "",
  useCredits: true,
  runway_ml_api_key: "",
};

interface ProfileState {
  profile: ProfileType;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (uid: string, newProfile: Partial<ProfileType>) => Promise<void>;
  minusCredits: (uid: string, amount: number) => Promise<boolean>;
  addCredits: (uid: string, amount: number) => Promise<void>;
  deleteAccount: (uid: string) => Promise<void>;
}

const mergeProfileWithDefaults = (
  profile: Partial<ProfileType>,
  authState: {
    authEmail?: string;
    authDisplayName?: string;
    authPhotoUrl?: string;
  }
): ProfileType => ({
  ...defaultProfile,
  ...profile,
  credits: profile.credits && profile.credits >= CREDITS_THRESHOLD ? profile.credits : DEFAULT_CREDITS,
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
});

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile,

  fetchProfile: async (uid: string) => {
    if (!uid) return;

    const { authEmail, authDisplayName, authPhotoUrl, authEmailVerified } =
      useAuthStore.getState();

    try {
      const profileData = await fetchUserProfile(uid);

      const newProfile = profileData
        ? mergeProfileWithDefaults(profileData, {
            authEmail,
            authDisplayName,
            authPhotoUrl,
          })
        : createNewProfile(
            authEmail,
            authDisplayName,
            authPhotoUrl,
            authEmailVerified
          );

      await saveUserProfile(uid, newProfile);
      set({ profile: newProfile });
    } catch (error) {
      handleProfileError("fetching or creating profile", error);
    }
  },

  updateProfile: async (uid: string, newProfile: Partial<ProfileType>) => {
    if (!uid) return;

    try {
      const updatedProfile = { ...get().profile, ...newProfile };

      set({ profile: updatedProfile });
      await updateUserProfile(uid, updatedProfile);
    } catch (error) {
      handleProfileError("updating profile", error);
    }
  },

  deleteAccount: async (uid: string) => {
    if (!uid) return;

    try {
      await deleteUserAccount(uid);
    } catch (error) {
      handleProfileError("deleting account", error);
    }
  },

  minusCredits: async (uid: string, amount: number) => {
    if (!uid) return false;

    const profile = get().profile;
    if (profile.credits < amount) return false;

    try {
      const newCredits = profile.credits - amount;
      await updateUserProfile(uid, { credits: newCredits });
      set({ profile: { ...profile, credits: newCredits } });
      return true;
    } catch (error) {
      handleProfileError("using credits", error);
      return false;
    }
  },

  addCredits: async (uid: string, amount: number) => {
    if (!uid) return;

    const profile = get().profile;
    const newCredits = profile.credits + amount;

    try {
      await updateUserProfile(uid, { credits: newCredits });
      set({ profile: { ...profile, credits: newCredits } });
    } catch (error) {
      handleProfileError("adding credits", error);
    }
  },
}));

// Helper function to create a new profile
function createNewProfile(
  authEmail?: string,
  authDisplayName?: string,
  authPhotoUrl?: string,
  authEmailVerified?: boolean
): ProfileType {
  return {
    email: authEmail || "",
    contactEmail: "",
    displayName: authDisplayName || "",
    photoUrl: authPhotoUrl || "",
    emailVerified: authEmailVerified || false,
    credits: DEFAULT_CREDITS,
    fireworks_api_key: "",
    openai_api_key: "",
    stability_api_key: "",
    bria_api_key: "",
    did_api_key: "",
    replicate_api_key: "",
    selectedAvatar: "",
    selectedTalkingPhoto: "",
    useCredits: true,
    runway_ml_api_key: "",
  };
}

// Helper function to handle errors
function handleProfileError(action: string, error: unknown): void {
  logError(`Profile - ${action}`, error);
}

export default useProfileStore;
