// hooks/useScreenRecorder.ts
import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";
import { MediaStreamManager } from "../utils/MediaStreamManager";
import { uploadRecording } from "@/services/storageService";
import { downloadBlob } from "@/utils/downloadUtils";
import { RecordingManager } from "../utils/RecordingManager";
import { MediaStreamError } from "../types/mediaStreamTypes";

export const useScreenRecorder = () => {
  const { recorderStatus, updateStatus } = useRecorderStatusStore();
  const { uid } = useAuthStore();
  const [isRecordingWindowOpen, setIsRecordingWindowOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaManager = useRef<MediaStreamManager>(
    new MediaStreamManager((status) => updateStatus(status))
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
        setError("An unexpected error occurred. Please try again.");
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
              console.log(`Upload progress: ${progress.progress}%`);
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

    try {
      if (!uid) {
        throw new Error("Please sign in to start recording");
      }

      setError(null);
      const currentMediaManager = mediaManager.current;
      await currentMediaManager.initializeScreenCapture();
      setIsRecordingWindowOpen(true);
      updateStatus("ready");
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
    updateStatus("idle");
    setIsRecordingWindowOpen(false);
  }, [updateStatus]);

  // Handle recorder status changes
  useEffect(() => {
    const handleStatus = async () => {
      switch (recorderStatus) {
        case "shouldStart":
          await startRecording();
          break;
        case "shouldStop":
          await stopRecording();
          break;
      }
    };

    handleStatus();
  }, [recorderStatus, startRecording, stopRecording]);

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
    screenStream: mediaManager.current.currentScreenStream,
  };
};

export default useScreenRecorder;
