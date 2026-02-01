import { useCallback } from "react";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

import { auth } from "@/firebase/firebaseClient";
import { logger } from "@/utils/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { clearServerSessionCookie } from "@/services/sessionCookieService";

/**
 * Options for sign-out behavior
 */
interface SignOutOptions {
  /** Show success toast after sign-out (default: true) */
  showToast?: boolean;
  /** Message to show in success toast */
  successMessage?: string;
  /** Redirect to this URL after sign-out (default: "/") */
  redirectUrl?: string;
  /** Delay before redirect in ms (default: 500) */
  redirectDelay?: number;
  /** Whether to perform a full page reload (default: true for complete state reset) */
  fullReload?: boolean;
}

const DEFAULT_OPTIONS: Required<SignOutOptions> = {
  showToast: true,
  successMessage: "Signed out successfully",
  redirectUrl: "/",
  redirectDelay: 500,
  fullReload: true,
};

/**
 * Clears all browser cookies for the current domain
 */
function clearAllCookies(): void {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    // Delete cookie for all paths
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
  }
}

/**
 * Clears all browser storage (localStorage and sessionStorage)
 */
function clearAllStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error("Error clearing localStorage", error);
  }

  try {
    sessionStorage.clear();
  } catch (error) {
    logger.error("Error clearing sessionStorage", error);
  }
}

/**
 * Resets all Zustand stores to their default state
 */
function resetAllStores(): void {
  // Auth store
  useAuthStore.getState().clearAuthDetails();

  // Profile store
  useProfileStore.getState().resetProfile();

  // Payments store
  usePaymentsStore.setState({
    payments: [],
    paymentsLoading: false,
    paymentsError: null,
  });
}

/**
 * Custom hook that provides sign-out functionality with full cleanup.
 *
 * Consolidates sign-out logic that was previously duplicated across:
 * - ProfileComponent (sign out button)
 * - SupportPage (hard reset)
 * - useAuthHandlers (modal sign out)
 *
 * @returns Object with signOut function and loading state helpers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { performSignOut } = useSignOut();
 *
 *   const handleSignOut = async () => {
 *     await performSignOut({ successMessage: "Goodbye!" });
 *   };
 *
 *   return <button onClick={handleSignOut}>Sign Out</button>;
 * }
 * ```
 */
export function useSignOut() {
  /**
   * Performs a complete sign-out with full cleanup:
   * 1. Clears server-side session cookie
   * 2. Signs out from Firebase Auth
   * 3. Resets all Zustand stores
   * 4. Clears all cookies
   * 5. Clears localStorage and sessionStorage
   * 6. Optionally redirects with full page reload
   */
  const performSignOut = useCallback(async (options: SignOutOptions = {}) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // 1. Clear server-side session cookie first (for security)
      try {
        await clearServerSessionCookie();
      } catch (error) {
        // Log but continue - we still want to complete client-side sign out
        logger.warn("Failed to clear server session cookie", error);
      }

      // 2. Sign out from Firebase
      await signOut(auth);

      // 3. Reset all Zustand stores
      resetAllStores();

      // 4. Clear all cookies
      clearAllCookies();

      // 5. Clear all storage
      clearAllStorage();

      // 6. Show success message
      if (opts.showToast) {
        toast.success(opts.successMessage);
      }

      // 7. Redirect with optional full page reload
      if (opts.redirectUrl) {
        setTimeout(() => {
          if (opts.fullReload) {
            window.location.href = opts.redirectUrl;
          } else {
            // For cases where we don't need a full reload
            window.location.assign(opts.redirectUrl);
          }
        }, opts.redirectDelay);
      }
    } catch (error) {
      logger.error("Error during sign out", error);
      toast.error("Failed to sign out. Please try again.");
      throw error;
    }
  }, []);

  /**
   * Performs sign-out without redirect (useful for modals or inline contexts)
   */
  const performSignOutQuiet = useCallback(async () => {
    await performSignOut({
      showToast: false,
      redirectUrl: "",
      fullReload: false,
    });
  }, [performSignOut]);

  return {
    performSignOut,
    performSignOutQuiet,
    // Export utilities for advanced use cases
    clearAllCookies,
    clearAllStorage,
    resetAllStores,
  };
}

/**
 * Standalone function for sign-out (useful outside of React components)
 * Note: Prefer useSignOut hook when inside a React component
 */
export async function performSignOutStandalone(options: SignOutOptions = {}): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    await clearServerSessionCookie();
  } catch (error) {
    logger.warn("Failed to clear server session cookie", error);
  }

  await signOut(auth);
  resetAllStores();
  clearAllCookies();
  clearAllStorage();

  if (opts.showToast) {
    toast.success(opts.successMessage);
  }

  if (opts.redirectUrl) {
    setTimeout(() => {
      window.location.href = opts.redirectUrl;
    }, opts.redirectDelay);
  }
}
