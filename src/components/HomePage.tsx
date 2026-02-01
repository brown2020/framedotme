"use client";

import type { ReactElement } from "react";
import { useRef } from "react";

import { Footer } from "@/components/Footer";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { isReactNativeWebView } from "@/utils/platform";

import {
  AuthenticatedDashboard,
  SignInForm,
  HeroContent,
  FeaturesSection,
  HowItWorksSection,
  SocialProofSection,
} from "./home";

/**
 * Home page component that displays the landing page with authentication
 * Shows marketing content for unauthenticated users or dashboard for authenticated users
 *
 * @returns The home page component with responsive layout
 */
export function HomePage(): ReactElement {
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const displayName = useAuthStore((state) => state.authDisplayName);
  const isAuthenticated = authReady && !!uid;

  const formRef = useRef<HTMLFormElement>(null);
  const showGoogleSignIn = !isReactNativeWebView();

  const {
    email,
    setEmail,
    password,
    setPassword,
    acceptTerms,
    setAcceptTerms,
    isEmailLinkLogin,
    setIsEmailLinkLogin,
    signInWithGoogle,
    handlePasswordAuth,
    handlePasswordReset,
  } = useAuthHandlers(() => {});

  const handleGoogleSignIn = async () => {
    if (!acceptTerms) {
      formRef.current?.reportValidity();
      return;
    }
    await signInWithGoogle();
  };

  // Authenticated Dashboard
  if (isAuthenticated) {
    return (
      <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
        <AuthenticatedDashboard displayName={displayName} />
        <Footer />
      </div>
    );
  }

  // Marketing Landing Page with Integrated Sign-In
  return (
    <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full">
        {/* Hero Section with Integrated Sign-In */}
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <HeroContent />
            <SignInForm
              formRef={formRef}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              isEmailLinkLogin={isEmailLinkLogin}
              setIsEmailLinkLogin={setIsEmailLinkLogin}
              showGoogleSignIn={showGoogleSignIn}
              onGoogleSignIn={handleGoogleSignIn}
              onFormSubmit={handlePasswordAuth}
              onPasswordReset={handlePasswordReset}
            />
          </div>
        </section>

        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
      </div>
      <Footer />
    </div>
  );
}
