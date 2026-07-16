import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Capture",
  description: "Start a new screen recording session",
  robots: { index: false, follow: false },
};

export default function CaptureLayout({ children }: { children: ReactNode }) {
  return children;
}
