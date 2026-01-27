import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { MediaStreamManager } from "../utils/MediaStreamManager";
import { uploadRecording } from "@/services/storageService";
import { downloadBlob } from "@/utils/downloadUtils";
import { RecordingManager } from "../utils/RecordingManager";
import { MediaStreamError } from "../types/mediaStreamTypes";
import type { RecorderStatusType } from "../types/recorder";
import { logger } from "@/utils/logger";
import { getErrorMessage } from "@/utils/errorFormatters";

export const useScreenRecorder = () => {
  const { recorderStatus, setRecorderStatus } = useRecorderStatusStore();
  const { uid } = useAuthStore();
  const [isRecordingWindowOpen, setIsRecordingWindowOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

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

    currentMediaManager.cleanup();
    await currentRecordingManager.cleanup();
    setError(null);
    setScreenStream(null);
    void updateStatus("idle");
    setIsRecordingWindowOpen(false);
  }, [updateStatus]);

  // Handle recorder status changes based on status transitions
  // Use refs to avoid dependency issues with callbacks
  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecording);
  
  useEffect(() => {
    startRecordingRef.current = startRecording;
    stopRecordingRef.current = stopRecording;
  }, [startRecording, stopRecording]);

  // Process status change requests
  const processStatusChange = useCallback(async (status: RecorderStatusType) => {
    if (status === "shouldStart") {
      await startRecordingRef.current();
    } else if (status === "shouldStop") {
      await stopRecordingRef.current();
    }
  }, []);

  useEffect(() => {
    void processStatusChange(recorderStatus);
  }, [recorderStatus, processStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    const currentMediaManager = mediaManager.current;
    const currentRecordingManager = recordingManager.current;

    return () => {
      currentMediaManager.cleanup();
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
