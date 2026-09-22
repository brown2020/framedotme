import { useState, useCallback } from "react";
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import toast from "react-hot-toast";

import { useAuthStore } from "@/zustand/useAuthStore";
import { auth } from "@/firebase/firebaseClient";
import { handleError } from "@/lib/errors";
import { mapFirebaseAuthError } from "@/lib/firebaseAuthErrors";
import { browserStorage } from "@/services/browserStorageService";
import { useSignOut } from "@/hooks/useSignOut";
import { AUTH_PENDING_TIMEOUT_MS, AUTH_STORAGE_KEYS } from "@/constants/auth";

/**
 * Custom hook that provides authentication handlers (legacy home/modal paths).
 * Dedicated /login /signup /forgot-password pages are preferred (Auth UX).
 */
export function useAuthHandlers(hideModal: () => void) {
  const setAuthDetails = useAuthStore((s) => s.setAuthDetails);
  const { performSignOutQuiet } = useSignOut();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [isEmailLinkLogin, setIsEmailLinkLogin] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    if (!acceptTerms) return;
    setAuthBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      hideModal();
    } catch (error) {
      toast.error(mapFirebaseAuthError(error));
    } finally {
      setAuthBusy(false);
    }
  }, [acceptTerms, hideModal]);

  const handleSignOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await performSignOutQuiet();
      hideModal();
    } catch (error) {
      toast.error(mapFirebaseAuthError(error, "Failed to sign out. Please try again."));
    } finally {
      setAuthBusy(false);
    }
  }, [performSignOutQuiet, hideModal]);

  const saveEmailToStorage = useCallback(() => {
    browserStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, email);
    const emailName = email.split("@")[0];
    if (emailName) {
      browserStorage.setItem(AUTH_STORAGE_KEYS.NAME, emailName);
    }
  }, [email]);

  const handlePasswordAuth = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAuthBusy(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        saveEmailToStorage();
        hideModal();
      } catch (error: unknown) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (code === "auth/email-already-in-use") {
          try {
            await signInWithEmailAndPassword(auth, email, password);
            saveEmailToStorage();
            hideModal();
          } catch (loginError) {
            toast.error(mapFirebaseAuthError(loginError));
          }
          return;
        }
        toast.error(mapFirebaseAuthError(error));
      } finally {
        setAuthBusy(false);
      }
    },
    [email, password, hideModal, saveEmailToStorage],
  );

  const handleEmailLinkSignIn = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAuthBusy(true);

      const actionCodeSettings = {
        url: `${window.location.origin}/loginfinish`,
        handleCodeInApp: true,
      };

      try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        browserStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, email);
        browserStorage.setItem(AUTH_STORAGE_KEYS.NAME, name);
        setAuthDetails({ authPending: true });

        setTimeout(() => {
          setAuthDetails({ authPending: false });
        }, AUTH_PENDING_TIMEOUT_MS);
      } catch (error) {
        handleError("Send sign-in link", error, { showToast: true });
        toast.error(mapFirebaseAuthError(error));
      } finally {
        setAuthBusy(false);
      }
    },
    [email, name, setAuthDetails],
  );

  const handlePasswordReset = useCallback(async () => {
    if (!email) {
      toast.error("Please enter your email to reset your password.");
      return;
    }

    setAuthBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      toast.error(mapFirebaseAuthError(error));
    } finally {
      setAuthBusy(false);
    }
  }, [email]);

  return {
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
    authBusy,
    signInWithGoogle,
    handleSignOut,
    handlePasswordAuth,
    handleEmailLinkSignIn,
    handlePasswordReset,
  };
}
