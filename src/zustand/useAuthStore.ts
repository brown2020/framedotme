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

// ============================================================================
// Exported Selectors
// ============================================================================
// Use these selectors to prevent unnecessary re-renders.
// Each selector subscribes only to the specific slice of state it returns,
// so components using them won't re-render when unrelated state changes.

// State selectors
export const useUid = () => useAuthStore((state) => state.uid);
export const useAuthEmail = () => useAuthStore((state) => state.authEmail);
export const useAuthDisplayName = () => useAuthStore((state) => state.authDisplayName);
export const useAuthPhotoUrl = () => useAuthStore((state) => state.authPhotoUrl);
export const useAuthEmailVerified = () => useAuthStore((state) => state.authEmailVerified);
export const useAuthReady = () => useAuthStore((state) => state.authReady);
export const useAuthPending = () => useAuthStore((state) => state.authPending);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin);
export const useIsAllowed = () => useAuthStore((state) => state.isAllowed);
export const useIsInvited = () => useAuthStore((state) => state.isInvited);
export const useLastSignIn = () => useAuthStore((state) => state.lastSignIn);
export const usePremium = () => useAuthStore((state) => state.premium);

// Derived selectors
export const useIsAuthenticated = () => useAuthStore((state) => state.authReady && !!state.uid);

// Action selectors
export const useSetAuthDetails = () => useAuthStore((state) => state.setAuthDetails);
export const useClearAuthDetails = () => useAuthStore((state) => state.clearAuthDetails);
