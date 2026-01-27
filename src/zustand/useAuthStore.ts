import { create } from "zustand";
import { AuthState, DEFAULT_AUTH_STATE } from "@/types/auth.types";

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => void;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  ...DEFAULT_AUTH_STATE,

  setAuthDetails: (details: Partial<AuthState>) => {
    set((state) => ({ ...state, ...details }));
  },

  clearAuthDetails: () => set({ ...DEFAULT_AUTH_STATE }),
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

// Permissions and features (grouped selectors for related data)
export const useAuthPermissions = () => useAuthStore((state) => ({
  isAdmin: state.isAdmin,
  isAllowed: state.isAllowed,
  isInvited: state.isInvited,
}));

export const useAuthFeatures = () => useAuthStore((state) => ({
  premium: state.premium,
}));

