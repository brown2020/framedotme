import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { MediaStreamManager } from "../utils/MediaStreamManager";
import { uploadRecording } from "@/services/storageService";
import { downloadBlob } from "@/utils/downloadUtils";
import { RecordingManager } from "../utils/RecordingManager";
import { MediaStreamError } from "../types/mediaStreamTypes";
import { RecorderStatusType } from "../types/recorder";
import { updateRecorderStatus } from "@/services/recorderStatusService";
import { logger } from "@/utils/logger";

function getErrorDetails(err: unknown): { code?: string; message: string } {
  if (err && typeof err === "object") {
    const anyErr = err as {
      code?: unknown;
      message?: unknown;
      name?: unknown;
      stage?: unknown;
      debug?: unknown;
    };
    const code = typeof anyErr.code === "string" ? anyErr.code : undefined;
    const message =
      typeof anyErr.message === "string"
        ? anyErr.message
        : typeof anyErr.name === "string"
          ? anyErr.name
          : "Unknown error";
    const stage = typeof anyErr.stage === "string" ? anyErr.stage : undefined;
    const debug = typeof anyErr.debug === "string" ? anyErr.debug : undefined;
    const stitchedCode = stage ? `${stage}${code ? ` | ${code}` : ""}` : code;
    const stitchedMessage = debug ? `${message} (${debug})` : message;
    return { code: stitchedCode, message: stitchedMessage };
  }
  return { message: typeof err === "string" ? err : "Unknown error" };
}

export const useScreenRecorder = () => {
  const { recorderStatus, setRecorderStatus } = useRecorderStatusStore();
  const { uid } = useAuthStore();
  const [isRecordingWindowOpen, setIsRecordingWindowOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const updateStatus = useCallback(
    async (status: RecorderStatusType) => {
      setRecorderStatus(status);
      if (uid) {
        try {
          await updateRecorderStatus(uid, status);
        } catch (error) {
          logger.error("Failed to sync recorder status", error);
        }
      }
    },
    [uid, setRecorderStatus]
  );

  const mediaManager = useRef<MediaStreamManager>(
    new MediaStreamManager((status) => {
      void updateStatus(status);
    })
  );
  const recordingManager = useRef<RecordingManager>(new RecordingManager());

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof MediaStreamError) {
        switch (error.type) {
          case "permission":
            setError("Permission denied. Please allow access to continue.");
            break;
          case "device":
            setError(
              "Failed to access recording device. Please check your settings."
            );
            break;
          case "stream":
            setError("Failed to process media stream. Please try again.");
            break;
          default:
            setError("An unexpected error occurred. Please try again.");
        }
      } else {
        const details = getErrorDetails(error);
        // Surface the real Firebase error so debugging isn't guesswork.
        // Example codes: "storage/unauthorized", "permission-denied"
        setError(details.code ? `${details.code}: ${details.message}` : details.message);
        logger.error("Recording save failed", error);
      }
      updateStatus("error");
    },
    [updateStatus]
  );

  const handleRecordingData = useCallback(
    async (finalBlob: Blob) => {
      if (!uid) {
        setError("Not authenticated. Please sign in to save recordings.");
        return;
      }

      try {
        const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
        const random = Math.floor(Math.random() * 1000);
        const filename = `video_${timestamp}_${random}.webm`;

        await uploadRecording(
          uid,
          finalBlob,
          filename,
          (progress) => {
            if (progress.status === "error") {
              handleError(progress.error);
            } else {
              logger.debug(`Upload progress: ${progress.progress}%`);
            }
          }
        );

        // Download locally
        downloadBlob(finalBlob, filename);

      } catch (error) {
        handleError(error);
      }
    },
    [uid, handleError]
  );

  const startRecording = useCallback(async () => {
    const currentMediaManager = mediaManager.current;
    try {
      const combinedStream = await currentMediaManager.createCombinedStream();
      recordingManager.current.startRecording(combinedStream, () => {});
      await updateStatus("recording");
    } catch (error) {
      handleError(error);
    }
  }, [updateStatus, handleError]);

  const stopRecording = useCallback(async () => {
    const currentRecordingManager = recordingManager.current;
    try {
      await updateStatus("saving");
      const finalBlob = await currentRecordingManager.stopRecording();
      await handleRecordingData(finalBlob);
      await updateStatus("ready");
    } catch (error) {
      handleError(error);
    }
  }, [handleRecordingData, updateStatus, handleError]);

  const initializeRecorder = useCallback(async () => {
    if (isRecordingWindowOpen) return;

    try {
      if (!uid) {
        // Not an exceptional condition during initial render / redirect.
        // Show a friendly message and bail without triggering the Next.js error overlay.
        setError("Please sign in to start recording");
        return;
      }

      setError(null);
      const currentMediaManager = mediaManager.current;
      const stream = await currentMediaManager.initializeScreenCapture();
      setScreenStream(stream);
      setIsRecordingWindowOpen(true);
      await updateStatus("ready");
    } catch (error) {
      handleError(error);
    }
  }, [isRecordingWindowOpen, updateStatus, handleError, uid]);

  const resetRecorder = useCallback(() => {
    const currentMediaManager = mediaManager.current;
    const currentRecordingManager = recordingManager.current;

    currentMediaManager.cleanup();
    currentRecordingManager.cleanup();
    setError(null);
    setScreenStream(null);
    void updateStatus("idle");
    setIsRecordingWindowOpen(false);
  }, [updateStatus]);

  // Handle recorder status changes
  // Use refs to avoid dependency issues with callbacks
  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecording);
  
  useEffect(() => {
    startRecordingRef.current = startRecording;
    stopRecordingRef.current = stopRecording;
  }, [startRecording, stopRecording]);

  useEffect(() => {
    const handleStatus = async () => {
      switch (recorderStatus) {
        case "shouldStart":
          await startRecordingRef.current();
          break;
        case "shouldStop":
          await stopRecordingRef.current();
          break;
      }
    };

    void handleStatus();
  }, [recorderStatus]);

  // Cleanup on unmount
  useEffect(() => {
    const currentMediaManager = mediaManager.current;
    const currentRecordingManager = recordingManager.current;

    return () => {
      currentMediaManager.cleanup();
      currentRecordingManager.cleanup();
    };
  }, []);

  return {
    recorderStatus,
    updateStatus,
    initializeRecorder,
    startRecording,
    stopRecording,
    resetRecorder,
    error,
    isRecordingWindowOpen,
    screenStream,
  };
};

export default useScreenRecorder;
