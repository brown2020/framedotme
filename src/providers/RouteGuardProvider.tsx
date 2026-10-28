"use client";

import type { ReactNode } from "react";
import { ClipLoader } from "react-spinners";
import { useAuthStore } from "@/zustand/useAuthStore";

/**
 * Route guard provider that shows loading state during authentication
 * Auth redirects are handled by Next.js 16 proxy (src/proxy.ts) at the Edge level
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The route guard with loading state
 */
export const RouteGuardProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactNode => {
  const authReady = useAuthStore((state) => state.authReady);
  const sessionError = useAuthStore((state) => state.sessionError);
  const loading = !authReady;

  if (sessionError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#333b51] px-6 text-center">
        <p className="text-white text-lg">{sessionError}</p>
        <button
          type="button"
          className="bg-white text-gray-900 px-4 py-2 rounded-md font-semibold"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#333b51]">
        <ClipLoader color="#fff" size={80} />
      </div>
    );
  }

  return <>{children}</>;
};
