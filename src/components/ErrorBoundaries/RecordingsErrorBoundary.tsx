import { ReactNode } from "react";
import { FeatureErrorBoundary } from "./FeatureErrorBoundary";

interface RecordingsErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary specifically for the Recordings feature
 * Provides context-specific error handling for recording operations
 */
export function RecordingsErrorBoundary({ children }: RecordingsErrorBoundaryProps) {
  return (
    <FeatureErrorBoundary
      featureName="Recordings"
      onReset={() => {
        // Optional: Clear any recordings-specific state
        window.location.href = "/recordings";
      }}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
