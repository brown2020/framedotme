// components/VideoControlsPage.tsx
"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useScreenRecorder from "@/hooks/useScreenRecorder";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/zustand/useAuthStore";
import { logger } from "@/utils/logger";
import { VIDEO_DIMENSION_UPDATE_INTERVAL_MS } from "@/lib/constants";
import { getRecorderButtonClass, getRecorderButtonText } from "@/utils/recorderStyles";

export default function VideoControlsPage(): ReactElement {
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const uid = useAuthStore((state) => state.uid);
  const {
    recorderStatus,
    updateStatus,
    initializeRecorder,
    screenStream,
    resetRecorder,
    error,
  } = useScreenRecorder();
  const screenVideoElem = useRef<HTMLVideoElement | null>(null);
  const hasInitialized = useRef(false);

  // Auto-initialize only once when component mounts
  useEffect(() => {
    if (!uid || hasInitialized.current) return;
    
    if (recorderStatus === "idle") {
      hasInitialized.current = true;
      initializeRecorder();
    }
  }, [uid, recorderStatus, initializeRecorder]);

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
      currentScreenVideoElem.play().catch((error) => logger.error("Error playing video", error));
      currentScreenVideoElem.addEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    }

    const intervalId = setInterval(updateVideoDimensions, VIDEO_DIMENSION_UPDATE_INTERVAL_MS);

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
    if (!uid) return;
    if (recorderStatus === "idle") {
      initializeRecorder();
    } else if (recorderStatus === "ready") {
      updateStatus("shouldStart");
    } else if (recorderStatus === "recording") {
      updateStatus("shouldStop");
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
          className={cn(getRecorderButtonClass(recorderStatus, "controls"))}
          onClick={handleRecordingControl}
          disabled={isRecordButtonDisabled}
        >
          {getRecorderButtonText(recorderStatus)}
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
