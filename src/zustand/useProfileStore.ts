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
import { OperationQueue } from "@/utils/optimisticUpdate";
import type { Profile } from "@/types/profile";
import type { AuthContext } from "@/types/auth";

/**
 * Operation queue for credit modifications.
 * Ensures sequential execution of credit operations to prevent race conditions
 * when multiple operations (e.g., minusCredits and addCredits) overlap.
 *
 * Without this queue, concurrent operations could read stale credit values
 * and produce incorrect results or corrupt rollback state.
 */
const creditOperationQueue = new OperationQueue<number>();

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
  credits: initializeCredits(profile.credits),
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
      const profileData = await fetchUserProfile(uid);

      const newProfile = profileData
        ? buildProfileFromData(profileData, authContext || {})
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

  /**
   * Subtracts credits from the user's profile.
   *
   * Uses an operation queue to prevent race conditions when multiple
   * credit operations occur simultaneously.
   *
   * @param uid - User ID
   * @param amount - Amount of credits to subtract
   * @returns true if successful, false if insufficient credits or error
   */
  minusCredits: async (uid: string, amount: number) => {
    if (!uid) return false;

    // Check credits before queueing to fail fast
    const currentCredits = get().profile.credits;
    if (currentCredits < amount) return false;

    try {
      let success = false;

      await creditOperationQueue.execute(
        // Get current value - reads fresh state when operation executes
        () => get().profile.credits,
        // Calculate new value
        (current) => {
          // Double-check credits are sufficient at execution time
          if (current < amount) {
            throw new Error("Insufficient credits");
          }
          return current - amount;
        },
        // Apply optimistic update
        (newCredits) => {
          set({ profile: { ...get().profile, credits: newCredits } });
        },
        // Perform actual operation
        async (newCredits) => {
          await updateUserProfile(uid, { credits: newCredits });
          success = true;
        },
        // Rollback on failure - restore previous credits
        (previousCredits) => {
          set({ profile: { ...get().profile, credits: previousCredits } });
        }
      );

      return success;
    } catch (error) {
      handleProfileError("using credits", error);
      return false;
    }
  },

  /**
   * Adds credits to the user's profile.
   *
   * Uses an operation queue to prevent race conditions when multiple
   * credit operations occur simultaneously.
   *
   * @param uid - User ID
   * @param amount - Amount of credits to add
   */
  addCredits: async (uid: string, amount: number) => {
    if (!uid) return;

    try {
      await creditOperationQueue.execute(
        // Get current value - reads fresh state when operation executes
        () => get().profile.credits,
        // Calculate new value
        (current) => current + amount,
        // Apply optimistic update
        (newCredits) => {
          set({ profile: { ...get().profile, credits: newCredits } });
        },
        // Perform actual operation
        async (newCredits) => {
          await updateUserProfile(uid, { credits: newCredits });
        },
        // Rollback on failure - restore previous credits
        (previousCredits) => {
          set({ profile: { ...get().profile, credits: previousCredits } });
        }
      );
    } catch (error) {
      handleProfileError("adding credits", error);
      throw error;
    }
  },
}));

export default useProfileStore;

/**
 * Optimized selectors for profile state.
 * Use these instead of directly accessing the store to prevent unnecessary re-renders.
 */

// Individual profile data selectors
export const useProfile = () => useProfileStore((state) => state.profile);
export const useCredits = () => useProfileStore((state) => state.profile.credits);
export const useDisplayName = () => useProfileStore((state) => state.profile.displayName);
export const usePhotoUrl = () => useProfileStore((state) => state.profile.photoUrl);
export const useEmail = () => useProfileStore((state) => state.profile.email);

// Action selectors
export const useFetchProfile = () => useProfileStore((state) => state.fetchProfile);
export const useUpdateProfile = () => useProfileStore((state) => state.updateProfile);
export const useMinusCredits = () => useProfileStore((state) => state.minusCredits);
export const useAddCredits = () => useProfileStore((state) => state.addCredits);
export const useDeleteAccount = () => useProfileStore((state) => state.deleteAccount);
export const useResetProfile = () => useProfileStore((state) => state.resetProfile);
