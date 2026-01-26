import { useState } from "react";
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
import { auth } from "@/firebase/firebaseClient";
import { useAuthStore } from "@/zustand/useAuthStore";
import { handleError } from "@/utils/errorHandling";

/**
 * Type guard to check if an error is a Firebase error
 */
export function isFirebaseError(
  error: unknown
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

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
  const signInWithGoogle = async () => {
    if (!acceptTerms) return;

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
    } finally {
      hideModal();
    }
  };

  /**
   * Handles user sign-out
   */
  const handleSignOut = async () => {
    try {
      // Best-effort: clear server-side session cookie first
      await fetch("/api/session", { method: "DELETE" });
      await signOut(auth);
      clearAuthDetails();
    } catch (error) {
      handleError("Sign out", error, { showToast: true });
    } finally {
      hideModal();
    }
  };

  /**
   * Handles password-based login
   */
  const handlePasswordLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.localStorage.setItem("frameEmail", email);
      window.localStorage.setItem("frameName", email.split("@")[0]);
    } catch (error: unknown) {
      if (isFirebaseError(error)) {
        toast.error(error.message);
      }
    } finally {
      hideModal();
    }
  };

  /**
   * Handles password-based signup (creates new account)
   */
  const handlePasswordSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      window.localStorage.setItem("frameEmail", email);
      window.localStorage.setItem("frameName", email.split("@")[0]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ((error as { code?: string }).code === "auth/email-already-in-use") {
          handlePasswordLogin();
          return;
        }
      }
      hideModal();
      if (isFirebaseError(error)) {
        toast.error(error.message);
      }
    }
  };

  /**
   * Handles email link sign-in (passwordless)
   */
  const handleEmailLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const actionCodeSettings = {
      url: `${window.location.origin}/loginfinish`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("frameEmail", email);
      window.localStorage.setItem("frameName", name);
      setAuthDetails({ authPending: true });
    } catch (error) {
      handleError("Send sign-in link", error, { showToast: true });
      hideModal();
    }
  };

  /**
   * Handles password reset email
   */
  const handlePasswordReset = async () => {
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
  };

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
    handlePasswordSignup,
    handleEmailLinkSignIn,
    handlePasswordReset,
  };
}
