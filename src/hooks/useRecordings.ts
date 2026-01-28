import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import type { VideoMetadata } from "@/types/video";

import { getErrorMessage } from "@/lib/errors";
import { 
  fetchUserRecordings, 
  deleteRecording, 
  downloadRecording 
} from "@/services/storageService";
import { logger } from "@/utils/logger";

/**
 * Custom hook for managing recordings data and operations
 * Handles fetching, deleting, and downloading recordings for a user
 * 
 * @param uid - The authenticated user's unique identifier
 * @returns Recordings data, operations, and loading state
 */
export function useRecordings(uid: string) {
  const [videos, setVideos] = useState<VideoMetadata[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState<VideoMetadata | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!uid) return;
    
    try {
      setLoading(true);
      const videosData = await fetchUserRecordings(uid);
      setVideos(videosData);
      if (videosData.length > 0 && videosData[0]) {
        setFeaturedVideo(videosData[0]);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch recordings");
      logger.error("Error fetching recordings", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const handleDeleteVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await deleteRecording(uid, video);
      toast.success("Recording deleted successfully");
      
      // Refetch videos after deletion
      void fetchVideos();

      // If the deleted video is the featured video, reset it
      if (featuredVideo?.id === video.id) {
        setFeaturedVideo(null);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete recording");
      logger.error("Error deleting video", error);
      toast.error(message);
    }
  }, [uid, fetchVideos, featuredVideo]);

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
    setFeaturedVideo(video);
  }, []);

  const clearFeaturedVideo = useCallback(() => {
    setFeaturedVideo(null);
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
