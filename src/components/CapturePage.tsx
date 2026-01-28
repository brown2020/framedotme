"use client";

import { VideoControlsLauncher } from "@/components/VideoControlsLauncher";

/**
 * Capture page component that launches video recording controls
 * Provides interface to start screen recording
 * 
 * @returns The capture page with video controls launcher
 */
export function CapturePage() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex items-center bg-black justify-center h-20 w-28">
        <VideoControlsLauncher />
      </div>
    </div>
  );
}
