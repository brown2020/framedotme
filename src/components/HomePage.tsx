"use client";

import type { ReactElement } from "react";

import { Footer } from "@/components/Footer";
import { useAuthStore } from "@/zustand/useAuthStore";

import {
  AuthenticatedDashboard,
  HeroContent,
  FeaturesSection,
  HowItWorksSection,
  SocialProofSection,
} from "./home";
import { HomeAuthCta } from "./home/HomeAuthCta";

/**
 * Home page: marketing + auth CTAs, or dashboard when signed in.
 */
export function HomePage(): ReactElement {
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const displayName = useAuthStore((state) => state.authDisplayName);
  const isAuthenticated = authReady && !!uid;

  if (isAuthenticated) {
    return (
      <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
        <AuthenticatedDashboard displayName={displayName} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full">
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <HeroContent />
            <HomeAuthCta />
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
