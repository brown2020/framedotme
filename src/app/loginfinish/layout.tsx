import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Completing Sign In",
  description: "Finishing your authentication",
  robots: { index: false, follow: false },
};

export default function LoginFinishLayout({ children }: { children: ReactNode }) {
  return children;
}
