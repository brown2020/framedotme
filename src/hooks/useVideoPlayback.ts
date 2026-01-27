import { useEffect } from "react";
import { globalVideoRef } from "@/utils/avFunctions";
import { logger } from "@/utils/logger";

/**
 * Unified hook to manage video playback and overlay synchronization
 * Handles video element playback controls and automatically stops video when overlay content is shown
 * 
 * @param isAnimated - Whether the video is an animated GIF
 * @param isVideoPlaying - Whether the video is currently playing
 * @param toggleVideoPlaying - Function to toggle video playback state
 * @param poster - Optional poster image URL
 * @param silentGif - Optional silent GIF URL
 * @param waitingGif - Optional waiting GIF URL
 */
export const useVideoPlayback = (
  isAnimated: boolean,
  isVideoPlaying: boolean,
  toggleVideoPlaying: () => void,
  poster?: string,
  silentGif?: string,
  waitingGif?: string
) => {
  // Stop video when overlay content should be shown
  useEffect(() => {
    const shouldShowOverlay = poster || (isAnimated && silentGif) || (!isAnimated && waitingGif);
    
    if (shouldShowOverlay && isVideoPlaying) {
      toggleVideoPlaying();
    }
  }, [poster, isAnimated, silentGif, waitingGif, isVideoPlaying, toggleVideoPlaying]);

  // Manage video element playback
  useEffect(() => {
    if (!globalVideoRef.current || isAnimated) return;

    const videoElement = globalVideoRef.current;

    const handleEnded = () => {
      if (isVideoPlaying) {
        toggleVideoPlaying();
      }
    };

    videoElement.addEventListener("ended", handleEnded);

    if (isVideoPlaying) {
      videoElement.muted = false;
      videoElement.volume = 1.0;
      
      // Handle play() promise to prevent unhandled rejection errors
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // AbortError is expected when play is interrupted (e.g., video source changes)
          // Only log other types of errors
          if (error.name !== "AbortError") {
            logger.error("Video play error:", error);
          }
        });
      }
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.volume = 0.0;
      videoElement.muted = true;
    }

    return () => {
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [isAnimated, isVideoPlaying, toggleVideoPlaying]);
};
