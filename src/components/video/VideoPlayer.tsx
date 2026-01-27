import type { ReactElement } from "react";
import { globalVideoRef } from "@/utils/avFunctions";
import { DEFAULT_VIDEO_WIDTH, DEFAULT_VIDEO_HEIGHT } from "@/constants/recording";

interface VideoPlayerProps {
  videoSrc: string;
  poster?: string;
  isVideoPlaying: boolean;
  onToggle: () => void;
  containerClasses: string;
  mediaClasses: string;
}

/**
 * VideoPlayer component - Renders the video element with playback controls
 */
export const VideoPlayer = ({
  videoSrc,
  poster,
  isVideoPlaying,
  onToggle,
  containerClasses,
  mediaClasses,
}: VideoPlayerProps): ReactElement => {
  return (
    <div className={containerClasses} onClick={onToggle}>
      <video
        height={DEFAULT_VIDEO_HEIGHT}
        width={DEFAULT_VIDEO_WIDTH}
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
};
