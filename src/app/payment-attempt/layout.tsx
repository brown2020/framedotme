import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your payment",
  robots: { index: false, follow: false },
};

export default function PaymentAttemptLayout({ children }: { children: ReactNode }) {
  return children;
}
