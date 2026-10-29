import type { RecorderStatusType } from "@/types/recorder";

import { useCallback, useRef, useState, useEffect, type MutableRefObject } from "react";

import { getErrorMessage } from "@/lib/errors";
import toast from "react-hot-toast";
import { MediaStreamManager } from "@/lib/media-stream-manager";
import { RecordingManager } from "@/lib/recording-manager";
import { MediaStreamError } from "@/types/mediaStreamTypes";
import { uploadRecording } from "@/services/storageService";
import { downloadBlob } from "@/utils/downloadUtils";
import { logger } from "@/utils/logger";
import { RECORDING_CREDIT_COST } from "@/constants/payment";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { RECORDER_SHARE_ENDED, reportRecorderFailure } from "@/lib/recorderStatus";

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
  const { recorderStatus, statusMessage, setRecorderStatus } = useRecorderStatusStore();
  const { uid, authReady, authPending } = useAuthStore();
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

  const [mediaManager] = useState(
    () =>
      new MediaStreamManager(
        (status) => {
          setRecorderStatus(status);
        },
        (message) => {
          reportRecorderFailure(message);
        },
      ),
  );
  const [recordingManager] = useState(() => new RecordingManager());

  const handleError = useCallback(
    (error: unknown) => {
      const message = getErrorMessage(error, "Screen sharing could not start. Please try again.", "save recording");
      setError(message);
      toast.error(message);
      reportRecorderFailure(message);
      if (error instanceof MediaStreamError) {
        logger.warn("Recording could not start", {
          type: error.type,
          message: error.message,
          cause: error.originalError?.name,
        });
      } else {
        logger.error("Recording error", error);
      }
    },
    []
  );

  const handleRecordingData = useCallback(
    async (finalBlob: Blob) => {
      if (!uid) {
        const message = "Not authenticated. Please sign in to save recordings.";
        setError(message);
        reportRecorderFailure(message);
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
        useProfileStore.getState().applyCreditsLocally(-RECORDING_CREDIT_COST);

        // Download locally
        downloadBlob(finalBlob, filename);

      } catch (error) {
        handleError(error);
      }
    },
    [uid, handleError]
  );

  const startRecording = useCallback(async () => {
    try {
      const combinedStream = await mediaManager.createCombinedStream();
      await recordingManager.startRecording(combinedStream, () => {});
      updateStatus("recording");
    } catch (error) {
      handleError(error);
    }
  }, [mediaManager, recordingManager, updateStatus, handleError]);

  const stoppingRef = useRef(false);
  const stopRecording = useCallback(async () => {
    if (!recordingManager.isRecording || stoppingRef.current) {
      return;
    }
    stoppingRef.current = true;

    try {
      updateStatus("saving");
      const finalBlob = await recordingManager.stopRecording();
      await handleRecordingData(finalBlob);
      updateStatus("ready");
    } catch (error) {
      handleError(error);
    } finally {
      stoppingRef.current = false;
    }
  }, [handleRecordingData, recordingManager, updateStatus, handleError]);

  const initializeRecorder = useCallback(async () => {
    const live =
      screenStream?.getVideoTracks().some((track) => track.readyState === "live") ?? false;
    if (isRecordingWindowOpen && live) return;

    if (!uid) {
      const message = authPending || !authReady
        ? "Sign-in is still finishing. Wait a moment, then click Initialize Recording again."
        : "Please sign in to start recording.";
      setError(message);
      toast.error(message);
      reportRecorderFailure(message);
      return;
    }

    try {
      setError(null);
      const stream = await mediaManager.initializeScreenCapture();
      setScreenStream(stream);
      setIsRecordingWindowOpen(true);
      updateStatus("ready");
    } catch (error) {
      setScreenStream(null);
      setIsRecordingWindowOpen(false);
      handleError(error);
    }
  }, [
    authPending,
    authReady,
    handleError,
    isRecordingWindowOpen,
    mediaManager,
    screenStream,
    uid,
    updateStatus,
  ]);

  const resetRecorder = useCallback(async () => {
    await mediaManager.cleanup();
    await recordingManager.cleanup();
    setError(null);
    setScreenStream(null);
    updateStatus("idle");
    setIsRecordingWindowOpen(false);
  }, [mediaManager, recordingManager, updateStatus]);

  // Handle recorder status changes based on status transitions
  useEffect(() => {
    // Fire-and-forget: errors are handled within startRecording/stopRecording
    void handleStatusTransition(recorderStatus, startRecording, stopRecording, processingStatusChangeRef);
  }, [recorderStatus, startRecording, stopRecording]);

  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Save the take when the shared screen ends or this window is closing.
  useEffect(() => {
    mediaManager.setOnScreenEnded(() => {
      if (recordingManager.isRecording) {
        void stopRecordingRef.current();
        return;
      }
      setScreenStream(null);
      setIsRecordingWindowOpen(false);
      reportRecorderFailure(RECORDER_SHARE_ENDED);
    });

    const saveBeforeLeave = () => {
      void stopRecordingRef.current();
    };
    window.addEventListener("pagehide", saveBeforeLeave);

    return () => {
      mediaManager.setOnScreenEnded(undefined);
      window.removeEventListener("pagehide", saveBeforeLeave);
      void (async () => {
        await stopRecordingRef.current();
        await mediaManager.cleanup();
      })();
    };
  }, [mediaManager, recordingManager]);

  return {
    recorderStatus,
    statusMessage,
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
