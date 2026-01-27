"use client";

import type { ReactElement } from "react";
import { useMemo } from "react";
import logo from "@/app/assets/logo.png";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";
import { VideoPlayer } from "./video/VideoPlayer";
import { VideoOverlay } from "./video/VideoOverlay";

interface Props {
  videoSrc?: string;
  silentGif?: string;
  waitingGif?: string;
  isVideoPlaying: boolean;
  toggleVideoPlaying: () => void;
  isAnimated: boolean;
  poster?: string;
}

// Default fallback image
const DEFAULT_IMAGE = typeof logo === "string" ? logo : logo.src || "";

/**
 * VideoComponent - Main video display component that handles video playback and overlay display
 * Orchestrates video playback, animated GIFs, and poster images
 */
export default function VideoComponent({
  videoSrc,
  silentGif,
  waitingGif,
  isVideoPlaying,
  toggleVideoPlaying,
  isAnimated,
  poster,
}: Props): ReactElement | null {
  // Handle video playback and overlay synchronization
  useVideoPlayback(isAnimated, isVideoPlaying, toggleVideoPlaying, poster, silentGif, waitingGif);

  // Memoize computed values to prevent unnecessary recalculations
  const displayState = useMemo(() => ({
    showVideo: videoSrc && !isAnimated && isVideoPlaying,
    showImageOverlay: Boolean(poster || (isAnimated && silentGif) || (!isAnimated && waitingGif)),
    waitingImageSrc: waitingGif || poster || DEFAULT_IMAGE,
    silentImageSrc: silentGif || DEFAULT_IMAGE,
    isAnimatedWithGif: isAnimated && !!silentGif,
  }), [videoSrc, isAnimated, isVideoPlaying, poster, silentGif, waitingGif]);

  const containerClasses = `flex-1 h-full w-full relative overflow-hidden cursor-pointer bg-black`;
  const mediaClasses = `transform -translate-x-1/2 h-full object-cover absolute top-0 left-1/2 w-auto`;

  if (displayState.showVideo && videoSrc) {
    return (
      <VideoPlayer
        videoSrc={videoSrc}
        poster={poster}
        isVideoPlaying={isVideoPlaying}
        onToggle={toggleVideoPlaying}
        containerClasses={containerClasses}
        mediaClasses={mediaClasses}
      />
    );
  }

  if (displayState.showImageOverlay) {
    return (
      <VideoOverlay
        waitingImageSrc={displayState.waitingImageSrc}
        silentImageSrc={displayState.silentImageSrc}
        isAnimatedWithGif={displayState.isAnimatedWithGif}
        onToggle={toggleVideoPlaying}
        containerClasses={containerClasses}
        mediaClasses={mediaClasses}
      />
    );
  }

  return null;
}
