import { useReducer, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import type { VideoMetadata } from "@/types/video";

import { getErrorMessage } from "@/lib/errors";
import {
  fetchUserRecordings,
  deleteRecording,
  downloadRecording,
} from "@/services/storageService";
import { logger } from "@/utils/logger";

type RecordingsState = {
  videos: VideoMetadata[] | null;
  loading: boolean;
  featuredVideo: VideoMetadata | null;
};

type RecordingsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: VideoMetadata[] }
  | { type: "FETCH_ERROR" }
  | { type: "SET_FEATURED"; payload: VideoMetadata | null };

function recordingsReducer(
  state: RecordingsState,
  action: RecordingsAction,
): RecordingsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        videos: action.payload,
        featuredVideo:
          state.featuredVideo === null &&
          action.payload.length > 0 &&
          action.payload[0]
            ? action.payload[0]
            : state.featuredVideo,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false };
    case "SET_FEATURED":
      return { ...state, featuredVideo: action.payload };
    default:
      return state;
  }
}

/**
 * Custom hook for managing recordings data and operations
 * Handles fetching, deleting, and downloading recordings for a user
 *
 * @param uid - The authenticated user's unique identifier
 * @param authReady - Whether Firebase authentication is fully initialized
 * @returns Recordings data, operations, and loading state
 */
export function useRecordings(uid: string, authReady = true) {
  const [state, dispatch] = useReducer(recordingsReducer, {
    videos: null,
    loading: false,
    featuredVideo: null,
  });
  const { videos, loading, featuredVideo } = state;

  const fetchVideos = useCallback(async () => {
    // Only fetch if we have uid AND auth is ready (Firebase SDK initialized)
    if (!uid || !authReady) return;

    dispatch({ type: "FETCH_START" });
    fetchUserRecordings(uid)
      .then((videosData) => {
        dispatch({ type: "FETCH_SUCCESS", payload: videosData });
      })
      .catch((error: unknown) => {
        const message = getErrorMessage(error, "Failed to fetch recordings");
        logger.error("Error fetching recordings", error);
        toast.error(message);
        dispatch({ type: "FETCH_ERROR" });
      });
  }, [uid, authReady]);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const handleDeleteVideo = useCallback(
    async (video: VideoMetadata) => {
      try {
        await deleteRecording(uid, video);
        toast.success("Recording deleted successfully");

        // Refetch videos after deletion
        void fetchVideos();

        // If the deleted video is the featured video, reset it
        if (featuredVideo?.id === video.id) {
          dispatch({ type: "SET_FEATURED", payload: null });
        }
      } catch (error) {
        const message = getErrorMessage(error, "Failed to delete recording");
        logger.error("Error deleting video", error);
        toast.error(message);
      }
    },
    [uid, fetchVideos, featuredVideo],
  );

  const handleDownloadVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await downloadRecording(video);
      toast.success("Recording download started");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to download recording");
      logger.error("Error downloading the video", error);
      toast.error(message);
    }
  }, []);

  const handleFeaturedVideoChange = useCallback((video: VideoMetadata) => {
    dispatch({ type: "SET_FEATURED", payload: video });
  }, []);

  const clearFeaturedVideo = useCallback(() => {
    dispatch({ type: "SET_FEATURED", payload: null });
  }, []);

  return {
    videos,
    loading,
    featuredVideo,
    handleDeleteVideo,
    handleDownloadVideo,
    handleFeaturedVideoChange,
    clearFeaturedVideo,
  };
}
