import type { RecorderStatusType } from "@/types/recorder";

import { useCallback, useRef, useState, useEffect, type MutableRefObject } from "react";

import { MediaStreamError } from "@/types/mediaStreamTypes";
import { getErrorMessage } from "@/lib/errors";
import { MediaStreamManager } from "@/lib/media-stream-manager";
import { RecordingManager } from "@/lib/recording-manager";
import { uploadRecording } from "@/services/storageService";
import { downloadBlob } from "@/utils/downloadUtils";
import { logger } from "@/utils/logger";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";

/**
 * Handles recorder status transitions with concurrency protection
 * Processes status changes and delegates to appropriate recording handlers
 */
const handleStatusTransition = async (
  status: RecorderStatusType,
  startRecording: () => Promise<void>,
  stopRecording: () => Promise<void>,
  processingRef: MutableRefObject<boolean>
): Promise<void> => {
  // Guard against concurrent operations
  if (processingRef.current) {
    logger.warn(`Skipping status change to ${status} - operation already in progress`);
    return;
  }

  switch (status) {
    case "shouldStart":
      processingRef.current = true;
      try {
        await startRecording();
      } finally {
        processingRef.current = false;
      }
      break;

    case "shouldStop":
      processingRef.current = true;
      try {
        await stopRecording();
      } finally {
        processingRef.current = false;
      }
      break;

    case "idle":
    case "ready":
    case "recording":
    case "saving":
    case "error":
      // Expected stable states - no action needed
      break;

    default:
      logger.warn(`Unexpected recorder status transition: ${status}`);
      break;
  }
};

export const useScreenRecorder = () => {
  const { recorderStatus, setRecorderStatus } = useRecorderStatusStore();
  const { uid } = useAuthStore();
  const [isRecordingWindowOpen, setIsRecordingWindowOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const processingStatusChangeRef = useRef(false);

  const updateStatus = useCallback(
    (status: RecorderStatusType) => {
      setRecorderStatus(status);
    },
    [setRecorderStatus]
  );

  const mediaManager = useRef<MediaStreamManager>(
    new MediaStreamManager((status) => {
      setRecorderStatus(status);
    })
  );
  const recordingManager = useRef<RecordingManager>(new RecordingManager());

  const handleError = useCallback(
    (error: unknown) => {
      const message = getErrorMessage(error, "An unexpected error occurred", "save recording");
      setError(message);
      logger.error("Recording error", error);
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
      updateStatus("recording");
    } catch (error) {
      handleError(error);
    }
  }, [updateStatus, handleError]);

  const stopRecording = useCallback(async () => {
    const currentRecordingManager = recordingManager.current;
    
    // Guard: only stop if recording is actually in progress
    if (!currentRecordingManager.isRecording) {
      logger.warn("Attempted to stop recording when no recording is in progress");
      return;
    }
    
    try {
      updateStatus("saving");
      const finalBlob = await currentRecordingManager.stopRecording();
      await handleRecordingData(finalBlob);
      updateStatus("ready");
    } catch (error) {
      handleError(error);
    }
  }, [handleRecordingData, updateStatus, handleError]);

  const initializeRecorder = useCallback(async () => {
    if (isRecordingWindowOpen) return;
    
    if (!uid) {
      // Not an exceptional condition during initial render / redirect.
      // Show a friendly message and bail without triggering the Next.js error overlay.
      setError("Please sign in to start recording");
      return;
    }

    try {
      setError(null);
      const currentMediaManager = mediaManager.current;
      const stream = await currentMediaManager.initializeScreenCapture();
      setScreenStream(stream);
      setIsRecordingWindowOpen(true);
      updateStatus("ready");
    } catch (error) {
      handleError(error);
    }
  }, [isRecordingWindowOpen, updateStatus, handleError, uid]);

  const resetRecorder = useCallback(async () => {
    const currentMediaManager = mediaManager.current;
    const currentRecordingManager = recordingManager.current;

    await currentMediaManager.cleanup();
    await currentRecordingManager.cleanup();
    setError(null);
    setScreenStream(null);
    updateStatus("idle");
    setIsRecordingWindowOpen(false);
  }, [updateStatus]);

  // Handle recorder status changes based on status transitions
  useEffect(() => {
    // Fire-and-forget: errors are handled within startRecording/stopRecording
    void handleStatusTransition(recorderStatus, startRecording, stopRecording, processingStatusChangeRef);
  }, [recorderStatus, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    const currentMediaManager = mediaManager.current;
    const currentRecordingManager = recordingManager.current;

    return () => {
      // Fire-and-forget: cleanup errors are already logged internally
      void currentMediaManager.cleanup();
      void currentRecordingManager.cleanup();
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
