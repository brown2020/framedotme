// components/VideoControlsPage.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useScreenRecorder from "@/hooks/useScreenRecorder";
import { cn } from "@/lib/utils";

export default function VideoControlsPage() {
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const {
    recorderStatus,
    updateStatus,
    initializeRecorder,
    screenStream,
    resetRecorder,
    error,
  } = useScreenRecorder();
  const screenVideoElem = useRef<HTMLVideoElement | null>(null);

  // Add auto-initialization
  useEffect(() => {
    if (recorderStatus === "idle") {
      initializeRecorder();
    }
  }, [recorderStatus, initializeRecorder]);

  useEffect(() => {
    const currentScreenVideoElem = screenVideoElem.current;

    const updateVideoDimensions = () => {
      const ratio = window.devicePixelRatio || 1;
      if (currentScreenVideoElem) {
        setVideoWidth(Math.round(currentScreenVideoElem.videoWidth / ratio));
        setVideoHeight(Math.round(currentScreenVideoElem.videoHeight / ratio));
      }
    };

    const handleLoadedMetadata = () => {
      updateVideoDimensions();
    };

    if (currentScreenVideoElem && screenStream) {
      currentScreenVideoElem.srcObject = screenStream;
      currentScreenVideoElem.play().catch(console.error);
      currentScreenVideoElem.addEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    }

    const intervalId = setInterval(updateVideoDimensions, 500);

    return () => {
      if (currentScreenVideoElem) {
        currentScreenVideoElem.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
      clearInterval(intervalId);
    };
  }, [screenStream]);

  const handleRecordingControl = () => {
    if (recorderStatus === "idle") {
      initializeRecorder();
    } else if (recorderStatus === "ready") {
      updateStatus("shouldStart");
    } else if (recorderStatus === "recording") {
      updateStatus("shouldStop");
    }
  };

  const getRecordButtonText = () => {
    switch (recorderStatus) {
      case "idle":
        return "Initialize Recording";
      case "ready":
        return "Start Recording";
      case "recording":
        return "Stop Recording";
      case "saving":
        return "Saving...";
      default:
        return "Initialize Recording";
    }
  };

  const getRecordButtonClass = () => {
    switch (recorderStatus) {
      case "recording":
        return "bg-red-500 hover:bg-red-600";
      case "ready":
        return "bg-green-500 hover:bg-green-600";
      case "saving":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "";
    }
  };

  const isRecordButtonDisabled = !["idle", "ready", "recording"].includes(
    recorderStatus
  );

  return (
    <div className="flex flex-col space-y-3 h-full p-4">
      <div className="text-2xl font-bold">Video Controls</div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-gray-600">Status: {recorderStatus}</p>

      <div className="flex gap-2">
        <Button
          variant="default"
          className={cn(getRecordButtonClass())}
          onClick={handleRecordingControl}
          disabled={isRecordButtonDisabled}
        >
          {getRecordButtonText()}
        </Button>

        <Button
          variant="secondary"
          onClick={resetRecorder}
          disabled={
            recorderStatus === "recording" || recorderStatus === "saving"
          }
        >
          Reset
        </Button>
      </div>

      <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <video
          ref={screenVideoElem}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted
          controls
        />
      </div>

      <div className="flex gap-3 text-sm text-gray-600">
        <div className="flex flex-col">
          <div>Width: {videoWidth}px</div>
          <div>Height: {videoHeight}px</div>
          <div>
            Aspect:{" "}
            {videoWidth && videoHeight
              ? (videoWidth / videoHeight).toFixed(2)
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
