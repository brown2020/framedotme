import type { Timestamp } from "firebase/firestore";

/**
 * User profile type definition
 */
export interface Profile {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
  selectedAvatar: string;
  selectedTalkingPhoto: string;
  useCredits: boolean;
}

/**
 * Auth context for profile initialization
 */
export interface AuthContext {
  authEmail?: string;
  authDisplayName?: string;
  authPhotoUrl?: string;
  authEmailVerified?: boolean;
}

/**
 * Auth state type definition
 */
export interface AuthState {
  uid: string;
  authEmail: string;
  authDisplayName: string;
  authPhotoUrl: string;
  authEmailVerified: boolean;
  authReady: boolean;
  authPending: boolean;
  isAdmin: boolean;
  isAllowed: boolean;
  isInvited: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
}

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
