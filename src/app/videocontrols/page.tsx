"use client";

import VideoControlsPage from "@/components/VideoControlsPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function VideoControls() {
  return (
    <ErrorBoundary featureName="Video Controls">
      <VideoControlsPage />
    </ErrorBoundary>
  );
}
