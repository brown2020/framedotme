/**
 * Default values for state objects
 * Co-located defaults that are tightly coupled with their type definitions
 */

import type { AuthState } from "@/types/auth";
import type { Profile } from "@/types/profile";

/**
 * Default auth state values
 */
export const DEFAULT_AUTH_STATE: AuthState = {
  uid: "",
  authEmail: "",
  authDisplayName: "",
  authPhotoUrl: "",
  authEmailVerified: false,
  authReady: false,
  authPending: false,
  isAdmin: false,
  isAllowed: false,
  isInvited: false,
  lastSignIn: null,
  premium: false,
};

/**
 * Default profile values
 */
export const DEFAULT_PROFILE: Profile = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,
  selectedAvatar: "",
  selectedTalkingPhoto: "",
  useCredits: true,
};
