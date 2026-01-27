"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import CookieConsent from "react-cookie-consent";

import useAuthToken from "@/hooks/useAuthToken";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { useSyncAuthToFirestore } from "@/hooks/useSyncAuthToFirestore";

import { usePathname, useRouter } from "next/navigation";
import { RecorderStatusProvider } from "./RecorderStatusProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { shouldRedirectToHome } from "@/utils/routing";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { loading, uid } = useAuthToken(process.env.NEXT_PUBLIC_COOKIE_NAME!);
  const router = useRouter();
  const pathname = usePathname();
  useInitializeStores();
  useSyncAuthToFirestore();

  useEffect(() => {
    function adjustHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    window.addEventListener("resize", adjustHeight);
    window.addEventListener("orientationchange", adjustHeight);

    // Initial adjustment
    adjustHeight();

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustHeight);
      window.removeEventListener("orientationchange", adjustHeight);
    };
  }, []);

  useEffect(() => {
    if (window.ReactNativeWebView) {
      document.body.classList.add("noscroll");
    } else {
      document.body.classList.remove("noscroll");
    }

    return () => {
      document.body.classList.remove("noscroll");
    };
  }, []);

  useEffect(() => {
    if (shouldRedirectToHome(loading, uid, pathname)) {
      router.push("/");
    }
  }, [loading, pathname, router, uid]);

  if (loading)
    return (
      <ErrorBoundary>
        <div
          className={`flex flex-col items-center justify-center h-full bg-[#333b51]`}
        >
          <ClipLoader color="#fff" size={80} />
        </div>
      </ErrorBoundary>
    );

  // Only wrap children with RecorderStatusProvider when user is authenticated
  const wrappedChildren = uid ? (
    <RecorderStatusProvider>{children}</RecorderStatusProvider>
  ) : (
    children
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full">
        {wrappedChildren}
        {!window.ReactNativeWebView && (
          <CookieConsent>
            This app uses cookies to enhance the user experience.
          </CookieConsent>
        )}
        <Toaster position="bottom-center" />
      </div>
    </ErrorBoundary>
  );
}
