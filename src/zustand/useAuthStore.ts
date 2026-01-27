import { create } from "zustand";
import { Timestamp } from "firebase/firestore";

export interface AuthState {
  uid: string;
  firebaseUid: string;
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
  credits: number;
}

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => void;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultAuthState: AuthState = {
  uid: "",
  firebaseUid: "",
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
  credits: 1000,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...defaultAuthState,

  setAuthDetails: (details: Partial<AuthState>) => {
    set((state) => ({ ...state, ...details }));
  },

  clearAuthDetails: () => set({ ...defaultAuthState }),
}));

/**
 * Optimized selectors for common auth state access patterns
 * Use these instead of directly accessing the store to prevent unnecessary re-renders
 */

// Core auth state
export const useAuthUid = () => useAuthStore((state) => state.uid);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.uid);
export const useAuthReady = () => useAuthStore((state) => state.authReady);
export const useAuthPending = () => useAuthStore((state) => state.authPending);

// User profile info
export const useAuthEmail = () => useAuthStore((state) => state.authEmail);
export const useAuthDisplayName = () => useAuthStore((state) => state.authDisplayName);
export const useAuthPhotoUrl = () => useAuthStore((state) => state.authPhotoUrl);
export const useAuthEmailVerified = () => useAuthStore((state) => state.authEmailVerified);

// Permissions and features
export const useAuthPermissions = () => useAuthStore((state) => ({
  isAdmin: state.isAdmin,
  isAllowed: state.isAllowed,
  isInvited: state.isInvited,
}));

export const useAuthFeatures = () => useAuthStore((state) => ({
  credits: state.credits,
  premium: state.premium,
}));

// Backward compatibility - kept for existing code
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin);
export const useIsAllowed = () => useAuthStore((state) => state.isAllowed);
export const useCredits = () => useAuthStore((state) => state.credits);
export const useIsPremium = () => useAuthStore((state) => state.premium);

