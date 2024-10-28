import React, { useEffect, useRef } from "react";
import { VideoIcon } from "lucide-react";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";

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
      const left = 0;
      const top = 0;

      const features = `width=${width},height=${height},left=${left},top=${top}`;

      // Open a new window with the specified features
      videoControlsWindowRef.current = window.open(
        "/videocontrols",
        "videoControlsWindow",
        features
      );

      // Add event listener for the window close event
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
        return "bg-red-500 opacity-100"; // Class for recording state
      case "ready":
        return "bg-yellow-500 opacity-100"; // Class for starting/saving state
      case "idle":
      case "starting":
      case "saving":
      default:
        return "bg-transparent hover:bg-white/30 opacity-50 hover:opacity-100 focus:bg-white/30 focus:opacity-100"; // Default class
    }
  };

  const buttonClass = `flex flex-col h-full items-center justify-center px-2 py-1 w-full text-white transition-opacity duration-500 flex-shrink-0 focus:outline-none focus:transition-none ${getButtonClass()}`;

  return (
    <button className={buttonClass} onClick={openVideoControls}>
      <VideoIcon className="h-6 w-6 mx-auto" />
      <div className="text-xs">Record</div>
    </button>
  );
}
