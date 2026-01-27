import { useState, useEffect, useCallback } from "react";
import type { VideoMetadata } from "@/types/video";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { 
  fetchUserRecordings, 
  deleteRecording, 
  downloadRecording 
} from "@/services/storageService";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

/**
 * Custom hook for managing recordings data and operations
 * Handles fetching, deleting, and downloading recordings for a user
 * 
 * @param uid - The authenticated user's unique identifier
 * @returns Recordings data, operations, and loading state
 */
export function useRecordings(uid: string) {
  const { data: videos, loading, execute: fetchVideos } = useAsyncOperation<VideoMetadata[]>();
  const [featuredVideo, setFeaturedVideo] = useState<VideoMetadata | null>(null);

  useEffect(() => {
    if (!uid) return;
    
    // Fire-and-forget: useAsyncOperation handles errors internally
    void fetchVideos(async () => {
      const videosData = await fetchUserRecordings(uid);
      if (videosData.length > 0 && videosData[0]) {
        setFeaturedVideo(videosData[0]);
      }
      return videosData;
    });
  }, [uid, fetchVideos]);

  const handleDeleteVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await deleteRecording(uid, video);
      toast.success("Recording deleted successfully");
      
      // Fire-and-forget: refetch videos after deletion (errors handled by useAsyncOperation)
      void fetchVideos(() => fetchUserRecordings(uid));

      // If the deleted video is the featured video, reset it
      if (featuredVideo?.id === video.id) {
        setFeaturedVideo(null);
      }
    } catch (error) {
      logger.error("Error deleting video", error);
      toast.error("Failed to delete recording. Please try again.");
    }
  }, [uid, fetchVideos, featuredVideo]);

  const handleDownloadVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await downloadRecording(video);
      toast.success("Recording download started");
    } catch (error) {
      logger.error("Error downloading the video", error);
      toast.error("Failed to download recording. Please try again.");
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
