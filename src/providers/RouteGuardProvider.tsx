"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { useAuthStore } from "@/zustand/useAuthStore";
import { shouldRedirectToHome } from "@/utils/routing";

/**
 * Route guard provider that handles authentication-based redirects
 * Shows loading state during authentication and redirects unauthenticated users
 * Receives loading state from parent AuthProvider via render props
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The route guard with redirect logic
 */
export const RouteGuardProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const loading = !authReady;

  useEffect(() => {
    if (shouldRedirectToHome(loading, uid, pathname)) {
      router.push("/");
    }
  }, [loading, pathname, router, uid]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#333b51]">
        <ClipLoader color="#fff" size={80} />
      </div>
    );
  }

  return <>{children}</>;
};
