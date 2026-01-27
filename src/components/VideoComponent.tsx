"use client";

import Image from "next/image";
import React, { useEffect } from "react";
import logo from "@/app/assets/logo.png";
import { globalVideoRef } from "@/utils/avFunctions";

type Props = {
  videoSrc?: string;
  silentGif?: string;
  waitingGif?: string;
  isVideoPlaying: boolean;
  toggleVideoPlaying: () => void;
  isAnimated: boolean;
  poster?: string;
};

export default function VideoComponent({
  videoSrc,
  silentGif,
  waitingGif,
  isVideoPlaying,
  toggleVideoPlaying,
  isAnimated,
  poster,
}: Props) {
  // First useEffect: Handle video playback
  useEffect(() => {
    if (!globalVideoRef.current) return;
    if (isAnimated) return;

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
      videoElement.play();
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

  // Second useEffect: Stop video if showing poster/gif instead
  // MUST be before any conditional returns to satisfy React hooks rules
  useEffect(() => {
    if ((poster || (isAnimated && silentGif) || (!isAnimated && waitingGif)) && isVideoPlaying) {
      toggleVideoPlaying();
    }
  }, [poster, isAnimated, silentGif, waitingGif, isVideoPlaying, toggleVideoPlaying]);

  const handleVideoToggle = () => {
    toggleVideoPlaying();
  };

  const containerClasses = `flex-1 h-full w-full relative overflow-hidden cursor-pointer bg-black`;
  const mediaClasses = `transform -translate-x-1/2 h-full object-cover absolute top-0 left-1/2 w-auto`;

  if (videoSrc && !isAnimated && isVideoPlaying) {
    return (
      <div className={containerClasses} onClick={handleVideoToggle}>
        <video
          height={512}
          width={512}
          ref={globalVideoRef}
          className={mediaClasses}
          src={videoSrc}
          autoPlay={isVideoPlaying}
          muted={!isVideoPlaying}
          poster={poster}
          playsInline
        />
      </div>
    );
  }

  if (poster || (isAnimated && silentGif) || (!isAnimated && waitingGif)) {
    return (
      <div className={containerClasses}>
        <div
          className={`absolute top-0 left-0 h-full w-full bg-black ${
            isAnimated && silentGif ? "z-0 opacity-0" : "z-10 opacity-100"
          }`}
        >
          <Image
            src={waitingGif || poster || logo.src}
            onClick={handleVideoToggle}
            alt="animation"
            className={mediaClasses}
            height={512}
            width={512}
            priority={true}
            unoptimized={true}
          />
        </div>
        <div
          className={`absolute top-0 left-0 h-full w-full ${
            isAnimated && silentGif
              ? "z-10 opacity-100 cursor-default"
              : "z-0 opacity-0"
          }`}
        >
          <Image
            src={silentGif || logo.src}
            alt="animation"
            className={mediaClasses}
            height={512}
            width={512}
            priority={true}
            unoptimized={true}
          />
        </div>
      </div>
    );
  }

  return null;
}
