"use client";

import React, { useEffect, useRef } from "react";
import { VideoIcon } from "lucide-react";
import { useRecorderStatus } from "@/hooks/useRecorderStatus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRecorderButtonClass } from "@/utils/recorderStyles";
import {
  VIDEO_CONTROLS_WINDOW_WIDTH,
  VIDEO_CONTROLS_WINDOW_HEIGHT,
  VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS,
} from "@/lib/constants";

export default function VideoControlsLauncher() {
  const { recorderStatus, updateStatus } = useRecorderStatus();
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
      const left = window.screen.width - VIDEO_CONTROLS_WINDOW_WIDTH;
      const top = 0;

      const features = `width=${VIDEO_CONTROLS_WINDOW_WIDTH},height=${VIDEO_CONTROLS_WINDOW_HEIGHT},left=${left},top=${top}`;

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

    const intervalId = window.setInterval(checkWindowClosed, VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateStatus]);

  return (
    <Button
      variant="ghost"
      className={cn(
        "flex flex-col h-full items-center justify-center px-2 py-1 w-full rounded-none",
        "text-white transition-all duration-200",
        getRecorderButtonClass(recorderStatus, "launcher")
      )}
      onClick={openVideoControls}
    >
      <VideoIcon className="h-6 w-6 mx-auto" />
      <div className="text-xs">Record</div>
    </Button>
  );
}
