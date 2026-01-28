import { useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import toast from "react-hot-toast";

import { isFirebaseError } from "@/types/guards";

import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { handleError } from "@/lib/errors";
import { browserStorage } from "@/services/browserStorageService";
import { clearServerSessionCookie } from "@/services/sessionCookieService";
import { AUTH_PENDING_TIMEOUT_MS, AUTH_STORAGE_KEYS } from "@/constants/auth";

/**
 * Custom hook that provides all authentication handlers
 * @param hideModal - Callback to hide the modal after auth actions
 * @returns Authentication handler functions and form state
 */
export function useAuthHandlers(hideModal: () => void) {
  const setAuthDetails = useAuthStore((s) => s.setAuthDetails);
  const clearAuthDetails = useAuthStore((s) => s.clearAuthDetails);
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [isEmailLinkLogin, setIsEmailLinkLogin] = useState(false);

  /**
   * Handles Google OAuth sign-in
   */
  const signInWithGoogle = useCallback(async () => {
    if (!acceptTerms) return;

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      hideModal();
    } catch (error) {
      if (isFirebaseError(error)) {
        if (error.code === "auth/account-exists-with-different-credential") {
          toast.error(
            "An account with the same email exists with a different sign-in provider."
          );
        } else {
          toast.error(
            "Something went wrong signing in with Google\n" + error.message
          );
        }
      }
    }
  }, [acceptTerms, hideModal]);

  /**
   * Handles user sign-out
   */
  const handleSignOut = useCallback(async () => {
    try {
      // Clear server-side session cookie before client sign out for security
      await clearServerSessionCookie();
      await signOut(auth);
      clearAuthDetails();
      hideModal();
    } catch (error) {
      handleError("Sign out", error, { showToast: true });
    }
  }, [clearAuthDetails, hideModal]);

  /**
   * Helper function to save email to storage after successful auth
   */
   const saveEmailToStorage = useCallback(() => {
    browserStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, email);
    const emailName = email.split("@")[0];
    if (emailName) {
      browserStorage.setItem(AUTH_STORAGE_KEYS.NAME, emailName);
    }
  }, [email]);

  /**
   * Handles password-based authentication (signup or signin)
   * Creates new account if email doesn't exist, signs in if it does
   */
  const handlePasswordAuth = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      saveEmailToStorage();
      hideModal();
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ((error as { code?: string }).code === "auth/email-already-in-use") {
          // If email exists, attempt login instead
          try {
            await signInWithEmailAndPassword(auth, email, password);
            saveEmailToStorage();
            hideModal();
          } catch (loginError) {
            if (isFirebaseError(loginError)) {
              toast.error(loginError.message);
            }
          }
          return;
        }
      }
      if (isFirebaseError(error)) {
        toast.error(error.message);
      }
    }
  }, [email, password, hideModal, saveEmailToStorage]);

  /**
   * Handles email link sign-in (passwordless)
   */
  const handleEmailLinkSignIn = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const actionCodeSettings = {
      url: `${window.location.origin}/loginfinish`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      browserStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, email);
      browserStorage.setItem(AUTH_STORAGE_KEYS.NAME, name);
      setAuthDetails({ authPending: true });
      
      // Clear pending state if user doesn't complete sign-in
      setTimeout(() => {
        setAuthDetails({ authPending: false });
      }, AUTH_PENDING_TIMEOUT_MS);
    } catch (error) {
      handleError("Send sign-in link", error, { showToast: true });
    }
  }, [email, name, setAuthDetails]);

  /**
   * Handles password reset email
   */
  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      toast.error("Please enter your email to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      if (isFirebaseError(error)) {
        toast.error(error.message);
      }
    }
  }, [email]);

  return {
    // Form state
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    acceptTerms,
    setAcceptTerms,
    isEmailLinkLogin,
    setIsEmailLinkLogin,
    // Handlers
    signInWithGoogle,
    handleSignOut,
    handlePasswordAuth,
    handleEmailLinkSignIn,
    handlePasswordReset,
  };
}
