import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Recording Controls",
  description: "Control your screen recording",
  robots: { index: false, follow: false },
};

export default function VideoControlsLayout({ children }: { children: ReactNode }) {
  return children;
}
