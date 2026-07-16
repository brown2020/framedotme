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
