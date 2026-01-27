import type { ReactNode } from "react";
import { FeatureErrorBoundary } from "./FeatureErrorBoundary";

interface PaymentErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary specifically for Payment features
 * Ensures payment errors don't crash the entire application
 */
export function PaymentErrorBoundary({ children }: PaymentErrorBoundaryProps) {
  return (
    <FeatureErrorBoundary
      featureName="Payment"
      onReset={() => {
        // Optional: Clear payment state or redirect
        window.location.href = "/profile";
      }}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
