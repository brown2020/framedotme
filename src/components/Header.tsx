"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCallback, memo } from "react";
import { navItems } from "@/constants/menuItems";
import { ScanIcon } from "lucide-react";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { Z_INDEX } from "@/constants/ui";

/**
 * Header component that displays the app logo and navigation menu
 * Shows navigation items on desktop and handles React Native WebView interactions
 * Memoized and optimized for performance
 * 
 * @returns The header component with logo and navigation
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();

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
      role="banner"
    >
      <button
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
        className="flex h-full gap-2 opacity-0 md:opacity-100 items-center"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path) && pathname !== "/";
          
          return (
            <button
              key={item.path}
              className={`flex items-center gap-1 px-3 h-full transition duration-300 text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white ${
                isActive ? "opacity-100 bg-white/30" : "opacity-50"
              }`}
              onClick={() => router.push(item.path)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="h-9 aspect-square" aria-hidden="true">
                <item.icon size={30} className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
