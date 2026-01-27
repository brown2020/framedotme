"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { isReactNativeWebView } from "@/utils/platform";

/**
 * Viewport provider that handles viewport height adjustments and platform-specific styling
 * Manages CSS custom properties for responsive height and React Native WebView scroll behavior
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The viewport provider with adjusted styles
 */
export const ViewportProvider = ({ children }: { children: ReactNode }): ReactNode => {
  // Handle viewport height calculation for mobile devices
  useEffect(() => {
    const adjustHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

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

  // Handle React Native WebView scroll behavior
  useEffect(() => {
    if (isReactNativeWebView()) {
      document.body.classList.add("noscroll");
    } else {
      document.body.classList.remove("noscroll");
    }

    return () => {
      document.body.classList.remove("noscroll");
    };
  }, []);

  return <>{children}</>;
};
