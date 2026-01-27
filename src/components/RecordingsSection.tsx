"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { ClipLoader } from "react-spinners";

import type { VideoMetadata } from "@/types/video";
import { useRecordings } from "@/hooks/useRecordings";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { FeaturedVideoPlayer } from "./FeaturedVideoPlayer";
import { VideoGridItem } from "./VideoGridItem";
import { useAuthStore } from "@/zustand/useAuthStore";

/**
 * Recordings page component that displays all user recordings
 * Features a grid view of recordings with a featured video player
 * Allows users to view, download, and delete their recordings
 * 
 * @returns The recordings page component with video grid and featured player
 */
export function RecordingsSection(): ReactElement {
  const uid = useAuthStore((state) => state.uid);
  const [videoToDelete, setVideoToDelete] = useState<VideoMetadata | null>(null);

  const {
    videos,
    loading,
    featuredVideo,
    handleDeleteVideo,
    handleDownloadVideo,
    handleFeaturedVideoChange,
    clearFeaturedVideo,
  } = useRecordings(uid);

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <ClipLoader color="#3b82f6" size={60} />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
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
            setVideoToDelete(null);
          }
        }}
        onCancel={() => setVideoToDelete(null)}
      />
      <div className="p-4">
        {featuredVideo && (
          <FeaturedVideoPlayer
            video={featuredVideo}
            onClear={clearFeaturedVideo}
            onDownload={handleDownloadVideo}
            onDelete={(video) => setVideoToDelete(video)}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoGridItem
              key={video.id}
              video={video}
              onSelect={(video, event) => {
                event.stopPropagation();
                handleFeaturedVideoChange(video);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
