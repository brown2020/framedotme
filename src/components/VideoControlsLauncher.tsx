"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VideoIcon } from "lucide-react";
import { useRecorderStatus } from "@/hooks/useRecorderStatus";
import {
  VIDEO_CONTROLS_WINDOW_WIDTH,
  VIDEO_CONTROLS_WINDOW_HEIGHT,
  VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS,
} from "@/constants/recording";
import { RECORDER_POPUP_BLOCKED, RECORDER_POPUP_CLOSED, reportRecorderFailure } from "@/lib/recorderStatus";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";

export function VideoControlsLauncher(): ReactElement {
  const { recorderStatus, updateStatus } = useRecorderStatus();
  const statusMessage = useRecorderStatusStore((state) => state.statusMessage);
  const videoControlsWindowRef = useRef<Window | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const visibleError = openError || (recorderStatus === "error" ? statusMessage : null);

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
      const screenWidth = window.screen?.width || VIDEO_CONTROLS_WINDOW_WIDTH;
      const left = Math.max(0, screenWidth - VIDEO_CONTROLS_WINDOW_WIDTH);
      const top = 0;

      const features = `width=${VIDEO_CONTROLS_WINDOW_WIDTH},height=${VIDEO_CONTROLS_WINDOW_HEIGHT},left=${left},top=${top}`;

      const popup = window.open(
        "/videocontrols",
        "videoControlsWindow",
        features,
      );
      if (!popup || popup.closed) {
        setOpenError(RECORDER_POPUP_BLOCKED);
        reportRecorderFailure(RECORDER_POPUP_BLOCKED);
        return;
      }
      setOpenError(null);
      videoControlsWindowRef.current = popup;
      window.setTimeout(() => {
        if (popup.closed) {
          setOpenError(RECORDER_POPUP_BLOCKED);
          reportRecorderFailure(RECORDER_POPUP_BLOCKED);
          videoControlsWindowRef.current = null;
        }
      }, 300);
    }
  };

  useEffect(() => {
    const checkWindowClosed = () => {
      if (videoControlsWindowRef.current?.closed) {
        videoControlsWindowRef.current = null;
        if (recorderStatus !== "saving") {
          setOpenError(RECORDER_POPUP_CLOSED);
          reportRecorderFailure(RECORDER_POPUP_CLOSED);
        }
      }
    };

    const intervalId = window.setInterval(
      checkWindowClosed,
      VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [recorderStatus, updateStatus]);

  const getButtonText = () => {
    switch (recorderStatus) {
      case "recording":
        return "Stop Recording";
      case "ready":
        return "Start Recording";
      case "saving":
        return "Saving...";
      default:
        return "Open Recorder";
    }
  };

  const getButtonStyle = () => {
    switch (recorderStatus) {
      case "recording":
        return "bg-red-600 hover:bg-red-700 animate-pulse";
      case "ready":
        return "bg-green-600 hover:bg-green-700";
      case "saving":
        return "bg-blue-600 cursor-wait";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
    {visibleError ? (
      <p role="alert" data-testid="recorder-error" className="max-w-sm rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800">
        Status: error. {visibleError}{" "}
        <Link href="/videocontrols" className="font-semibold underline">
          Open recorder
        </Link>
      </p>
    ) : null}
    <button
      type="button"
      onClick={openVideoControls}
      disabled={recorderStatus === "saving"}
      className={`
        group relative overflow-hidden
        flex flex-col items-center justify-center gap-3
        px-12 py-8 rounded-2xl
        text-white font-bold text-lg
        shadow-2xl hover:shadow-3xl
        transition-all duration-300
        hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-blue-300
        ${getButtonStyle()}
      `}
    >
      <VideoIcon className="h-16 w-16" />
      <span className="text-xl">{getButtonText()}</span>
      {recorderStatus === "recording" && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      )}
    </button>
    </div>
  );
}
