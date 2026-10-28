import type { Timestamp } from "firebase/firestore";

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
  /** Set when the server session cookie could not be created. */
  sessionError: string | null;
  isAdmin: boolean;
  isAllowed: boolean;
  isInvited: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
}
