"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { navItems } from "@/constants/menuItems";
import { ScanIcon } from "lucide-react";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { Z_INDEX } from "@/constants/config";
import { useAuthStore } from "@/zustand/useAuthStore";

/**
 * Header: logo + authenticated app nav, or Sign in / Create account when signed out.
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const uid = useAuthStore((s) => s.uid);
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = authReady && !!uid;

  const handleLogoClick = useCallback(() => {
    if (isReactNativeWebView()) {
      window.ReactNativeWebView?.postMessage("refresh");
    } else {
      logger.debug("Not React Native WebView environment");
    }
    router.push("/");
  }, [router]);

  return (
    <header
      className="flex items-center justify-between h-16 px-4 bg-blue-800"
      style={{ zIndex: Z_INDEX.header }}
    >
      <button
        type="button"
        className="flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-white rounded-md px-2 py-1"
        onClick={handleLogoClick}
        aria-label="Go to home page"
      >
        <ScanIcon size={30} className="text-white" aria-hidden="true" />
        <span className="text-2xl uppercase whitespace-nowrap text-white ml-2">
          Frame.me
        </span>
      </button>
      <nav
        className="flex h-full gap-1 md:gap-2 items-center"
        aria-label="Main navigation"
      >
        {isAuthenticated
          ? navItems.map((item) => {
              const isActive =
                pathname.startsWith(item.path) && pathname !== "/";

              return (
                <button
                  type="button"
                  key={item.path}
                  className={`flex items-center gap-1 px-2 md:px-3 h-full transition duration-300 text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white ${
                    isActive ? "opacity-100 bg-white/30" : "opacity-50"
                  }`}
                  onClick={() => router.push(item.path)}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className="h-7 md:h-9 aspect-square"
                    aria-hidden="true"
                  >
                    <item.icon
                      size={28}
                      className="h-full w-full object-cover md:w-auto md:h-auto"
                    />
                  </div>
                  <span className="hidden md:inline text-xl font-bold">
                    {item.label}
                  </span>
                </button>
              );
            })
          : (
              <>
                <Link
                  href="/login"
                  className={`flex items-center px-3 py-1 mx-1 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-white ${
                    pathname.startsWith("/login")
                      ? "bg-white text-blue-900"
                      : "text-white hover:bg-white/15"
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className={`flex items-center px-3 py-1 mx-1 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-white ${
                    pathname.startsWith("/signup")
                      ? "bg-white text-blue-900"
                      : "text-white hover:bg-white/15"
                  }`}
                >
                  Create account
                </Link>
              </>
            )}
      </nav>
    </header>
  );
}
