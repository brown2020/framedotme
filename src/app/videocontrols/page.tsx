"use client";

import VideoControls from "@/components/VideoControls";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function VideoControlsPage() {
  return (
    <ErrorBoundary featureName="Video Controls">
      <VideoControls />
    </ErrorBoundary>
  );
}
