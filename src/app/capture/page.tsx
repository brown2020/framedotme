"use client";

import Toolbar from "@/components/Toolbar";
import VideoControlsLauncher from "@/components/VideoControlsLauncher";

export default function page() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex items-center bg-black justify-center h-20 w-28">
        <VideoControlsLauncher />
      </div>
    </div>
  );
}
