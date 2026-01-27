"use client";

import { memo, useCallback } from "react";
import type { VideoMetadata } from "@/types/video";

interface VideoGridItemProps {
  video: VideoMetadata;
  onSelect: (video: VideoMetadata, event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Video grid item component that displays a thumbnail in a grid layout
 * Clicking the item selects it as the featured video
 * Memoized to prevent unnecessary re-renders when sibling items update
 * 
 * @param props - Component props
 * @returns The video grid item with thumbnail
 */
export const VideoGridItem = memo(function VideoGridItem({ video, onSelect }: VideoGridItemProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onSelect(video, e);
    },
    [video, onSelect]
  );

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        aria-label={`Select ${video.filename} as featured video`}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <video 
          src={video.downloadUrl} 
          className="w-full h-full rounded-md" 
          preload="metadata"
          aria-label={`Video: ${video.filename}`}
        />
      </button>
      <div className="flex flex-col w-full px-1">
        <div className="overflow-hidden truncate" title={video.filename}>
          {video.filename}
        </div>
      </div>
    </div>
  );
});
