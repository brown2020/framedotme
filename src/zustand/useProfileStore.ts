import { create } from "zustand";
import {
  fetchUserProfile,
  saveUserProfile,
  updateUserProfile,
} from "@/services/userService";
import { DEFAULT_CREDITS } from "@/constants/payment";
import { logError } from "@/lib/errors";
import { DEFAULT_PROFILE } from "@/constants/defaults";
import { deleteCurrentAccount } from "@/actions/accountActions";
import type { Profile } from "@/types/profile";
import type { AuthContext } from "@/types/auth";

interface ProfileState {
  profile: Profile;
  fetchProfile: (uid: string, authContext?: AuthContext) => Promise<void>;
  updateProfile: (uid: string, newProfile: Partial<Profile>) => Promise<void>;
  applyCreditsLocally: (amount: number) => void;
  deleteAccount: (uid: string) => Promise<void>;
  resetProfile: () => void;
}

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
 * Builds a complete profile from partial data, defaults, and auth context
 * Initializes credits and merges auth state with proper fallbacks
 */
const buildProfileFromData = (
  profile: Partial<Profile>,
  authState: {
    authEmail?: string;
    authDisplayName?: string;
    authPhotoUrl?: string;
  }
): Profile => ({
  ...DEFAULT_PROFILE,
  ...profile,
  credits:
    typeof profile.credits === "number" && Number.isFinite(profile.credits)
      ? profile.credits
      : 0,
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
});

/**
 * Handles profile-related errors with consistent logging
 */
const handleProfileError = (action: string, error: unknown): void => {
  logError(`Profile - ${action}`, error);
};

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,

  fetchProfile: async (uid: string, authContext?: AuthContext) => {
    if (!uid) return;

    try {
      let profileData = await fetchUserProfile(uid);

      if (!profileData) {
        await saveUserProfile(
          uid,
          createNewProfile(
            authContext?.authEmail,
            authContext?.authDisplayName,
            authContext?.authPhotoUrl,
            authContext?.authEmailVerified,
          ),
        );
        profileData = await fetchUserProfile(uid);
      }

      set({
        profile: profileData
          ? buildProfileFromData(profileData, authContext || {})
          : createNewProfile(
              authContext?.authEmail,
              authContext?.authDisplayName,
              authContext?.authPhotoUrl,
              authContext?.authEmailVerified,
            ),
      });
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

      // Persist only the fields the caller changed so credits are not rewritten.
      await updateUserProfile(uid, newProfile);
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
      await deleteCurrentAccount();
      set({ profile: DEFAULT_PROFILE });
    } catch (error) {
      handleProfileError("deleting account", error);
      throw error;
    }
  },

  resetProfile: () => {
    set({ profile: DEFAULT_PROFILE });
  },

  /**
   * Applies a local-only credit adjustment after the server has committed it.
   * Negative amounts record a charge; positive amounts record a grant or refund.
   */
  applyCreditsLocally: (amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;

    set((state) => ({
      profile: {
        ...state.profile,
        credits: Math.max(0, state.profile.credits + amount),
      },
    }));
  },
}));

export default useProfileStore;
