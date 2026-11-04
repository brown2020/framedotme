// components/VideoControls.tsx
"use client";

import type { ReactElement, RefObject } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/zustand/useAuthStore";
import { logger } from "@/utils/logger";
import { VIDEO_DIMENSION_UPDATE_INTERVAL_MS } from "@/constants/recording";
import { getRecorderButtonClass, getRecorderButtonText } from "@/utils/recorderStyles";
import { screenCaptureUnavailableMessage } from "@/lib/screenCaptureError";
import { publishRecorderStatus, reportRecorderFailure } from "@/lib/recorderStatus";
import type { RecorderStatusType } from "@/types/recorder";

function subscribeToCaptureSupport() {
  return () => {};
}

function noCaptureWarningOnServer() {
  return null;
}

function useScreenPreviewSize(screenStream: MediaStream | null) {
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const screenVideoElem = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const currentScreenVideoElem = screenVideoElem.current;

    const updateVideoDimensions = () => {
      const ratio = window.devicePixelRatio || 1;
      if (!currentScreenVideoElem) return;
      setVideoWidth(Math.round(currentScreenVideoElem.videoWidth / ratio));
      setVideoHeight(Math.round(currentScreenVideoElem.videoHeight / ratio));
    };

    if (currentScreenVideoElem && screenStream) {
      currentScreenVideoElem.srcObject = screenStream;
      currentScreenVideoElem.play().catch((playError) => logger.error("Error playing video", playError));
      currentScreenVideoElem.addEventListener("loadedmetadata", updateVideoDimensions);
    }

    const intervalId = setInterval(updateVideoDimensions, VIDEO_DIMENSION_UPDATE_INTERVAL_MS);

    return () => {
      currentScreenVideoElem?.removeEventListener("loadedmetadata", updateVideoDimensions);
      clearInterval(intervalId);
    };
  }, [screenStream]);

  return { videoWidth, videoHeight, screenVideoElem };
}

function deriveRecorderControls(input: {
  recorderStatus: RecorderStatusType;
  statusMessage: string | null;
  error: string | null;
  screenStream: MediaStream | null;
  captureUnavailable: string | null;
}) {
  const hasLiveVideo =
    input.screenStream?.getVideoTracks().some((track) => track.readyState === "live") ?? false;
  const needsScreenStream =
    !hasLiveVideo && ["idle", "ready", "error"].includes(input.recorderStatus);
  const controlStatus: RecorderStatusType = input.recorderStatus === "error"
    ? "error"
    : needsScreenStream
      ? "idle"
      : input.recorderStatus;
  const visibleError = input.recorderStatus === "starting"
    ? null
    : input.statusMessage || input.error || input.captureUnavailable;
  const shownStatus = input.recorderStatus === "starting"
    ? "starting"
    : visibleError
      ? "error"
      : input.recorderStatus;

  return {
    needsScreenStream,
    controlStatus,
    visibleError,
    shownStatus,
    isRecordButtonDisabled: !["idle", "ready", "recording", "error"].includes(controlStatus),
  };
}

function requestRecordingControl(input: {
  captureUnavailable: string | null;
  needsScreenStream: boolean;
  uid: string;
  recorderStatus: RecorderStatusType;
  initializeRecorder: () => Promise<void> | void;
  updateStatus: (status: RecorderStatusType) => Promise<void> | void;
}) {
  if (input.captureUnavailable && (input.needsScreenStream || !input.uid)) {
    reportRecorderFailure(input.captureUnavailable);
    return;
  }
  if (input.needsScreenStream || !input.uid) {
    if (input.uid) publishRecorderStatus("starting");
    void input.initializeRecorder();
    return;
  }
  if (input.recorderStatus === "ready") {
    void input.updateStatus("shouldStart");
  } else if (input.recorderStatus === "recording") {
    void input.updateStatus("shouldStop");
  }
}

function RecorderError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription
        className="text-sm font-medium text-red-800"
        data-testid="recorder-error"
      >
        {message}
      </AlertDescription>
    </Alert>
  );
}

function ResetControl({
  recorderStatus,
  onReset,
}: {
  recorderStatus: RecorderStatusType;
  onReset: () => void;
}) {
  return (
    <Button
      variant="secondary"
      onClick={onReset}
      disabled={recorderStatus === "recording" || recorderStatus === "saving"}
    >
      Reset
    </Button>
  );
}

function ScreenPreview({
  videoRef,
  screenStream,
  visibleError,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  screenStream: MediaStream | null;
  visibleError: string | null;
}) {
  return (
    <div className="relative w-full min-h-48 border border-gray-200 rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-48 object-contain bg-black"
        autoPlay
        muted
        controls
      />
      {!screenStream && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-300">
          {visibleError ? "Screen share did not start" : "No screen shared yet"}
        </p>
      )}
    </div>
  );
}

function DimensionReadout({ videoWidth, videoHeight }: { videoWidth: number; videoHeight: number }) {
  const aspect = videoWidth && videoHeight ? (videoWidth / videoHeight).toFixed(2) : "N/A";
  return (
    <div className="flex gap-3 text-sm text-gray-600">
      <div className="flex flex-col">
        <div>Width: {videoWidth}px</div>
        <div>Height: {videoHeight}px</div>
        <div>Aspect: {aspect}</div>
      </div>
    </div>
  );
}

export function VideoControls(): ReactElement {
  const uid = useAuthStore((state) => state.uid);
  const {
    recorderStatus,
    statusMessage,
    updateStatus,
    initializeRecorder,
    screenStream,
    resetRecorder,
    error,
  } = useScreenRecorder();
  const { videoWidth, videoHeight, screenVideoElem } = useScreenPreviewSize(screenStream);
  const captureUnavailable = useSyncExternalStore(
    subscribeToCaptureSupport,
    screenCaptureUnavailableMessage,
    noCaptureWarningOnServer,
  );
  const controls = deriveRecorderControls({
    recorderStatus,
    statusMessage,
    error,
    screenStream,
    captureUnavailable,
  });

  return (
    <div className="flex flex-col space-y-3 h-full p-4">
      <div className="text-2xl font-bold">Video Controls</div>

      <p className="text-sm text-gray-600" data-testid="recorder-status">
        Status: {controls.shownStatus}
      </p>

      <RecorderError message={controls.visibleError} />

      <div className="flex gap-2">
        <Button
          variant="default"
          className={cn(getRecorderButtonClass(controls.controlStatus, "controls"))}
          onClick={() =>
            requestRecordingControl({
              captureUnavailable,
              needsScreenStream: controls.needsScreenStream,
              uid,
              recorderStatus,
              initializeRecorder,
              updateStatus,
            })
          }
          disabled={controls.isRecordButtonDisabled}
        >
          {getRecorderButtonText(controls.controlStatus)}
        </Button>

        <ResetControl recorderStatus={recorderStatus} onReset={resetRecorder} />
      </div>

      <ScreenPreview
        videoRef={screenVideoElem}
        screenStream={screenStream}
        visibleError={controls.visibleError}
      />

      <DimensionReadout videoWidth={videoWidth} videoHeight={videoHeight} />
    </div>
  );
}
