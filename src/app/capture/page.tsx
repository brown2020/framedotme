"use client";

import VideoControlsLauncher from "@/components/VideoControlsLauncher";

export default function Capture() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex items-center bg-black justify-center h-20 w-28">
        <VideoControlsLauncher />
      </div>
    </div>
  );
}
