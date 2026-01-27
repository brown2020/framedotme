"use client";

import { RecordingsSection } from "@/components/RecordingsSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Recordings() {
  return (
    <ErrorBoundary featureName="Recordings">
      <RecordingsSection />
    </ErrorBoundary>
  );
}
