import { create } from "zustand";
import type { AuthState } from "@/types/auth";
import { DEFAULT_AUTH_STATE } from "@/constants/defaults";

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
 * 
 * Note: Creating object selectors causes infinite loops in Zustand.
 * Always use primitive selectors or useAuthStore.getState() for one-time reads.
 */

// Core auth state
export const useAuthUid = () => useAuthStore((state) => state.uid);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.uid);
export const useAuthReady = () => useAuthStore((state) => state.authReady);
export const useAuthPending = () => useAuthStore((state) => state.authPending);
