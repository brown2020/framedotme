"use client";

import { memo, useCallback } from "react";
import type { VideoMetadata } from "@/types/video";

interface FeaturedVideoPlayerProps {
  video: VideoMetadata;
  onClear: () => void;
  onDownload: (video: VideoMetadata) => void;
  onDelete: (video: VideoMetadata) => void;
}

/**
 * Featured video player component that displays a video with action buttons
 * Shows video metadata, player, and controls for download/delete operations
 * Memoized and fully accessible with ARIA labels
 * 
 * @param props - Component props
 * @returns The featured video player with controls
 */
export const FeaturedVideoPlayer = memo(function FeaturedVideoPlayer({
  video,
  onClear,
  onDownload,
  onDelete,
}: FeaturedVideoPlayerProps) {
  const handleDownload = useCallback(() => onDownload(video), [video, onDownload]);
  const handleDelete = useCallback(() => onDelete(video), [video, onDelete]);

  return (
    <article className="flex flex-col mb-4" aria-label="Featured video player">
      <div className="flex gap-2 flex-wrap text-xs mb-2" role="region" aria-label="Video metadata">
        <span>
          <strong>Created:</strong> {video.createdAt.toDate().toLocaleString()}
        </span>
        <span>
          <strong>Filename:</strong> {video.filename || "No filename"}
        </span>
      </div>

      <video 
        src={video.downloadUrl} 
        controls 
        className="w-full border rounded-md"
        aria-label={`Featured video: ${video.filename}`}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Video actions">
        <a
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          href={video.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${video.filename} in new window`}
        >
          Open in new window
        </a>
        <button
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={onClear}
          aria-label="Clear featured video"
        >
          Clear Featured
        </button>
        <button
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleDownload}
          aria-label={`Download ${video.filename}`}
        >
          Download
        </button>
        <button
          className="text-white bg-red-500 p-2 rounded-md w-max my-2 hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={handleDelete}
          aria-label={`Delete ${video.filename}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
});
