import { useEffect } from "react";
import { globalVideoRef } from "@/utils/avFunctions";

/**
 * Hook to manage video playback state and event handling
 * 
 * @param isAnimated - Whether the video is an animated GIF
 * @param isVideoPlaying - Whether the video is currently playing
 * @param toggleVideoPlaying - Function to toggle video playback state
 */
export const useVideoPlayback = (
  isAnimated: boolean,
  isVideoPlaying: boolean,
  toggleVideoPlaying: () => void
) => {
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
            console.error("Video play error:", error);
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

/**
 * Hook to automatically stop video when showing overlay content
 * 
 * @param poster - Optional poster image URL
 * @param isAnimated - Whether the video is an animated GIF
 * @param silentGif - Optional silent GIF URL
 * @param waitingGif - Optional waiting GIF URL
 * @param isVideoPlaying - Whether the video is currently playing
 * @param toggleVideoPlaying - Function to toggle video playback state
 */
export const useVideoOverlaySync = (
  poster: string | undefined,
  isAnimated: boolean,
  silentGif: string | undefined,
  waitingGif: string | undefined,
  isVideoPlaying: boolean,
  toggleVideoPlaying: () => void
) => {
  useEffect(() => {
    const shouldShowOverlay = poster || (isAnimated && silentGif) || (!isAnimated && waitingGif);
    
    if (shouldShowOverlay && isVideoPlaying) {
      toggleVideoPlaying();
    }
  }, [poster, isAnimated, silentGif, waitingGif, isVideoPlaying, toggleVideoPlaying]);
};
