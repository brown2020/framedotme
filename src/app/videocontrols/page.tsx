"use client";

import { VideoControls as VideoControlsComponent } from "@/components/VideoControls";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function VideoControls() {
  return (
    <ErrorBoundary featureName="Video Controls">
      <VideoControlsComponent />
    </ErrorBoundary>
  );
}
