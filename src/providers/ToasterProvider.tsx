"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

/**
 * Provider that renders the global toast notification system
 * Separated for better separation of concerns and testability
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The toaster provider with notification system
 */
export function ToasterProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <Toaster position="bottom-center" />
    </>
  );
}
