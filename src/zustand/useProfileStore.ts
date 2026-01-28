import { create } from "zustand";
import { 
  fetchUserProfile, 
  saveUserProfile, 
  updateUserProfile, 
  deleteUserAccount 
} from "@/services/userService";
import { DEFAULT_CREDITS, CREDITS_THRESHOLD } from "@/constants/payment";
import { logError } from "@/lib/errors";
import { DEFAULT_PROFILE } from "@/constants/defaults";
import type { Profile } from "@/types/profile";
import type { AuthContext } from "@/types/auth";

interface ProfileState {
  profile: Profile;
  fetchProfile: (uid: string, authContext?: AuthContext) => Promise<void>;
  updateProfile: (uid: string, newProfile: Partial<Profile>) => Promise<void>;
  minusCredits: (uid: string, amount: number) => Promise<boolean>;
  addCredits: (uid: string, amount: number) => Promise<void>;
  deleteAccount: (uid: string) => Promise<void>;
  resetProfile: () => void;
}

/**
 * Initializes user credits with validation
 * Returns existing credits if valid, otherwise returns default credits
 */
const initializeCredits = (credits: number | undefined): number => {
  if (credits && credits >= CREDITS_THRESHOLD) {
    return credits;
  }
  return DEFAULT_CREDITS;
};

/**
 * Merges partial profile data with defaults and auth context
 * Ensures all required fields have valid values
 */
const mergeProfileWithDefaults = (
  profile: Partial<Profile>,
  authState: {
    authEmail?: string;
    authDisplayName?: string;
    authPhotoUrl?: string;
  }
): Profile => ({
  ...DEFAULT_PROFILE,
  ...profile,
  credits: initializeCredits(profile.credits),
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
});

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,

  fetchProfile: async (uid: string, authContext?: AuthContext) => {
    if (!uid) return;

    try {
      const profileData = await fetchUserProfile(uid);

      const newProfile = profileData
        ? mergeProfileWithDefaults(profileData, authContext || {})
        : createNewProfile(
            authContext?.authEmail,
            authContext?.authDisplayName,
            authContext?.authPhotoUrl,
            authContext?.authEmailVerified
          );

      await saveUserProfile(uid, newProfile);
      set({ profile: newProfile });
    } catch (error) {
      handleProfileError("fetching or creating profile", error);
    }
  },

  updateProfile: async (uid: string, newProfile: Partial<Profile>) => {
    if (!uid) return;

    const previousProfile = get().profile;
    
    try {
      const updatedProfile = { ...previousProfile, ...newProfile };

      // Optimistic update
      set({ profile: updatedProfile });
      
      // API call
      await updateUserProfile(uid, updatedProfile);
    } catch (error) {
      // Rollback on failure
      set({ profile: previousProfile });
      handleProfileError("updating profile", error);
      throw error;
    }
  },

  deleteAccount: async (uid: string) => {
    if (!uid) return;

    try {
      await deleteUserAccount(uid);
      set({ profile: DEFAULT_PROFILE });
    } catch (error) {
      handleProfileError("deleting account", error);
      throw error;
    }
  },

  resetProfile: () => {
    set({ profile: DEFAULT_PROFILE });
  },

  minusCredits: async (uid: string, amount: number) => {
    if (!uid) return false;

    const previousProfile = get().profile;
    if (previousProfile.credits < amount) return false;

    try {
      const newCredits = previousProfile.credits - amount;
      
      // Optimistic update
      set({ profile: { ...previousProfile, credits: newCredits } });
      
      // API call
      await updateUserProfile(uid, { credits: newCredits });
      return true;
    } catch (error) {
      // Rollback on failure
      set({ profile: previousProfile });
      handleProfileError("using credits", error);
      return false;
    }
  },

  addCredits: async (uid: string, amount: number) => {
    if (!uid) return;

    const previousProfile = get().profile;
    const newCredits = previousProfile.credits + amount;

    try {
      // Optimistic update
      set({ profile: { ...previousProfile, credits: newCredits } });
      
      // API call
      await updateUserProfile(uid, { credits: newCredits });
    } catch (error) {
      // Rollback on failure
      set({ profile: previousProfile });
      handleProfileError("adding credits", error);
      throw error;
    }
  },
}));

/**
 * Creates a new profile with default values
 */
const createNewProfile = (
  authEmail?: string,
  authDisplayName?: string,
  authPhotoUrl?: string,
  authEmailVerified?: boolean
): Profile => {
  return {
    email: authEmail || "",
    contactEmail: "",
    displayName: authDisplayName || "",
    photoUrl: authPhotoUrl || "",
    emailVerified: authEmailVerified || false,
    credits: DEFAULT_CREDITS,
    selectedAvatar: "",
    selectedTalkingPhoto: "",
    useCredits: true,
  };
};

/**
 * Handles profile-related errors with consistent logging
 */
const handleProfileError = (action: string, error: unknown): void => {
  logError(`Profile - ${action}`, error);
};

/**
 * Optimized selectors for profile state
 * Use these instead of directly accessing the store to prevent unnecessary re-renders
 */

// Individual profile properties
export const useProfile = () => useProfileStore((state) => state.profile);
export const useProfileEmail = () => useProfileStore((state) => state.profile.email);
export const useProfileCredits = () => useProfileStore((state) => state.profile.credits);
export const useProfileDisplayName = () => useProfileStore((state) => state.profile.displayName);
export const useProfilePhotoUrl = () => useProfileStore((state) => state.profile.photoUrl);
export const useProfileUseCredits = () => useProfileStore((state) => state.profile.useCredits);

// Grouped selector for profile info
export const useProfileInfo = () => useProfileStore((state) => ({
  email: state.profile.email,
  displayName: state.profile.displayName,
  photoUrl: state.profile.photoUrl,
  emailVerified: state.profile.emailVerified,
}));

export default useProfileStore;
