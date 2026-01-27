"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/zustand/useAuthStore";
import { 
  fetchUserRecordings, 
  deleteRecording, 
  downloadRecording 
} from "@/services/storageService";
import { VideoMetadata } from "@/types/video";
import { logger } from "@/utils/logger";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ClipLoader } from "react-spinners";

export default function RecordingsPage() {
  const uid = useAuthStore((state) => state.uid);

  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoToDelete, setVideoToDelete] = useState<VideoMetadata | null>(null);

  useEffect(() => {
    if (!uid) return;
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const videosData = await fetchUserRecordings(uid);
        setVideos(videosData);
        if (videosData.length > 0 && videosData[0]) {
          setFeaturedVideo(videosData[0]);
        }
      } catch (error) {
        logger.error("Error fetching videos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [uid]);

  const handleFeaturedVideoChange = useCallback((
    video: VideoMetadata,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    setFeaturedVideo(video);
  }, []);

  const handleDeleteVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await deleteRecording(uid, video);

      setVideos((prevVideos) => prevVideos.filter((v) => v.id !== video.id));

      // If the deleted video is the featured video, reset the featured video
      setFeaturedVideo((prevFeatured) => 
        prevFeatured?.id === video.id ? null : prevFeatured
      );
    } catch (error) {
      logger.error("Error deleting video", error);
    }
  }, [uid]);

  const clearFeaturedVideo = useCallback(() => {
    setFeaturedVideo(null);
  }, []);

  const handleDownloadVideo = useCallback(async (video: VideoMetadata) => {
    try {
      await downloadRecording(video);
    } catch (error) {
      logger.error("Error downloading the video", error);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <ClipLoader color="#3b82f6" size={60} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-3xl">
        <div>No recordings found.</div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={videoToDelete !== null}
        title="Delete Recording"
        message="Are you sure you want to delete this recording? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (videoToDelete) {
            handleDeleteVideo(videoToDelete);
          }
        }}
        onCancel={() => setVideoToDelete(null)}
      />
      <div className="p-4">
      {featuredVideo && (
        <div className="flex flex-col mb-4">
          <div className="flex gap-2 flex-wrap text-xs">
            <div>
              Created At: {featuredVideo.createdAt.toDate().toLocaleString()}
            </div>
            <div>Filename: {featuredVideo.filename || "No filename"}</div>
          </div>

          <video
            src={featuredVideo.downloadUrl}
            controls
            className="w-full border"
          />
          <div className="flex gap-2">
            <a
              className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
              href={featuredVideo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new window
            </a>
            <button
              className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
              onClick={clearFeaturedVideo}
            >
              Clear Featured
            </button>
            <button
              className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
              onClick={() => handleDownloadVideo(featuredVideo)}
            >
              Download
            </button>
            <button
              className="text-white bg-red-500 p-2 rounded-md w-max my-2"
              onClick={() => setVideoToDelete(featuredVideo)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div className="flex flex-col items-center" key={video.id}>
            <button
              onClick={(e) => handleFeaturedVideoChange(video, e)}
              aria-label="Set as Featured"
            >
              <video
                src={video.downloadUrl}
                className="w-full h-full rounded-md"
              />
            </button>
            <div className="flex flex-col w-full px-1">
              <div className="overflow-hidden truncate">{video.filename}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
