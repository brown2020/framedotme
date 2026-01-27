import type { ReactElement } from "react";
import Image from "next/image";

interface VideoOverlayProps {
  waitingImageSrc: string;
  silentImageSrc: string;
  isAnimatedWithGif: boolean;
  onToggle: () => void;
  containerClasses: string;
  mediaClasses: string;
}

/**
 * VideoOverlay component - Renders overlay images (waiting animation, silent GIF)
 */
export const VideoOverlay = ({
  waitingImageSrc,
  silentImageSrc,
  isAnimatedWithGif,
  onToggle,
  containerClasses,
  mediaClasses,
}: VideoOverlayProps): ReactElement => {
  return (
    <div className={containerClasses}>
      {/* Waiting/Poster Layer */}
      <div
        className={`absolute top-0 left-0 h-full w-full bg-black ${
          isAnimatedWithGif ? "z-0 opacity-0" : "z-10 opacity-100"
        }`}
      >
        <Image
          src={waitingImageSrc}
          onClick={onToggle}
          alt="waiting animation"
          className={mediaClasses}
          height={512}
          width={512}
          priority
          unoptimized
        />
      </div>
      
      {/* Silent Animation Layer */}
      <div
        className={`absolute top-0 left-0 h-full w-full ${
          isAnimatedWithGif ? "z-10 opacity-100 cursor-default" : "z-0 opacity-0"
        }`}
      >
        <Image
          src={silentImageSrc}
          alt="silent animation"
          className={mediaClasses}
          height={512}
          width={512}
          priority
          unoptimized
        />
      </div>
    </div>
  );
};
