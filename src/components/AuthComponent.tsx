"use client";

import { useRef } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { isReactNativeWebView } from "@/utils/platform";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { AuthModal } from "./auth/AuthModal";
import { SignedInView } from "./auth/SignedInView";
import { PendingSignInView } from "./auth/PendingSignInView";
import { SignInForm } from "./auth/SignInForm";

/**
 * Main authentication component that handles all sign-in/sign-up flows
 */
export default function AuthComponent() {
  const uid = useAuthStore((s) => s.uid);
  const authEmail = useAuthStore((s) => s.authEmail);
  const authDisplayName = useAuthStore((s) => s.authDisplayName);
  const authPending = useAuthStore((s) => s.authPending);
  
  const formRef = useRef<HTMLFormElement>(null);
  const showGoogleSignIn = !isReactNativeWebView();

  const { isVisible, showModal, hideModal, modalRef } = useAuthModal();
  
  const {
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
    signInWithGoogle,
    handleSignOut,
    handlePasswordSignup,
    handleEmailLinkSignIn,
    handlePasswordReset,
  } = useAuthHandlers(hideModal);

  const handleGoogleSignIn = async () => {
    if (!acceptTerms) {
      formRef.current?.reportValidity();
      return;
    }
    await signInWithGoogle();
  };

  const handleFormSubmit = isEmailLinkLogin
    ? handleEmailLinkSignIn
    : handlePasswordSignup;

  return (
    <>
      {uid && (
        <button
          onClick={showModal}
          className="btn-secondary max-w-md mx-auto text-white"
        >
          You are signed in
        </button>
      )}
      {!uid && (
        <button onClick={showModal} className="btn-white max-w-md mx-auto">
          Sign In to Enable Your Account
        </button>
      )}

      <AuthModal isVisible={isVisible} modalRef={modalRef} onClose={hideModal}>
        {uid ? (
          <SignedInView
            displayName={authDisplayName}
            email={authEmail}
            onSignOut={handleSignOut}
          />
        ) : authPending ? (
          <PendingSignInView email={email} onStartOver={handleSignOut} />
        ) : (
          <SignInForm
            formRef={formRef}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            acceptTerms={acceptTerms}
            setAcceptTerms={setAcceptTerms}
            isEmailLinkLogin={isEmailLinkLogin}
            setIsEmailLinkLogin={setIsEmailLinkLogin}
            showGoogleSignIn={showGoogleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            onSubmit={handleFormSubmit}
            onPasswordReset={handlePasswordReset}
          />
        )}
      </AuthModal>
    </>
  );
}
