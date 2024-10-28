"use client";

import { useRef } from "react";

import VideoControlsLauncher from "./VideoControlsLauncher";

export default function Toolbar() {
  const toolbarRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        ref={toolbarRef}
        className={`flex justify-between h-14 w-full transition-opacity duration-500 opacity-100 bg-app text-white`}
      >
        <div className="flex">
          <VideoControlsLauncher />
        </div>
      </div>
    </div>
  );
}
