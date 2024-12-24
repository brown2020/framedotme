// components/VideoControlsLauncher.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { VideoIcon } from "lucide-react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VideoControlsLauncher() {
  const { recorderStatus, updateStatus } = useRecorderStatusStore();
  const videoControlsWindowRef = useRef<Window | null>(null);

  const openVideoControls = () => {
    if (recorderStatus === "recording") {
      updateStatus("shouldStop");
    } else if (recorderStatus === "ready") {
      updateStatus("shouldStart");
    } else if (
      videoControlsWindowRef.current &&
      !videoControlsWindowRef.current.closed
    ) {
      videoControlsWindowRef.current.focus();
    } else {
      const width = 400;
      const height = 660;
      const left = window.screen.width - width;
      const top = 0;

      const features = `width=${width},height=${height},left=${left},top=${top}`;

      // Reset status before opening window
      updateStatus("idle");

      videoControlsWindowRef.current = window.open(
        "/videocontrols",
        "videoControlsWindow",
        features
      );

      videoControlsWindowRef.current?.addEventListener("beforeunload", () => {
        videoControlsWindowRef.current = null;
      });
    }
  };

  useEffect(() => {
    const checkWindowClosed = () => {
      if (videoControlsWindowRef.current?.closed) {
        videoControlsWindowRef.current = null;
        updateStatus("shouldStop");
      }
    };

    const intervalId = window.setInterval(checkWindowClosed, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateStatus]);

  const getButtonClass = () => {
    switch (recorderStatus) {
      case "recording":
        return "bg-red-500 hover:bg-red-600";
      case "ready":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "error":
        return "bg-destructive hover:bg-destructive/90";
      default:
        return "bg-transparent hover:bg-white/30";
    }
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "flex flex-col h-full items-center justify-center px-2 py-1 w-full rounded-none",
        "text-white transition-all duration-200",
        getButtonClass()
      )}
      onClick={openVideoControls}
    >
      <VideoIcon className="h-6 w-6 mx-auto" />
      <div className="text-xs">Record</div>
    </Button>
  );
}
