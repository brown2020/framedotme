"use client";

import type { ReactNode } from "react";
import { ClipLoader } from "react-spinners";
import { useAuthStore } from "@/zustand/useAuthStore";

/**
 * Route guard provider that shows loading state during authentication
 * Auth redirects are handled by middleware (proxy.ts) at the server level
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The route guard with loading state
 */
export const RouteGuardProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const authReady = useAuthStore((state) => state.authReady);
  const loading = !authReady;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#333b51]">
        <ClipLoader color="#fff" size={80} />
      </div>
    );
  }

  return <>{children}</>;
};
