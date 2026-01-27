"use client";

import RecordingsPage from "@/components/RecordingsPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Recordings() {
  return (
    <ErrorBoundary featureName="Recordings">
      <RecordingsPage />
    </ErrorBoundary>
  );
}
