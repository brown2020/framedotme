import type { VideoMetadata } from "@/types/video";

interface VideoGridItemProps {
  video: VideoMetadata;
  onSelect: (video: VideoMetadata, event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Video grid item component that displays a thumbnail in a grid layout
 * Clicking the item selects it as the featured video
 * 
 * @param props - Component props
 * @returns The video grid item with thumbnail
 */
export function VideoGridItem({ video, onSelect }: VideoGridItemProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={(e) => onSelect(video, e)}
        aria-label="Set as Featured"
      >
        <video src={video.downloadUrl} className="w-full h-full rounded-md" />
      </button>
      <div className="flex flex-col w-full px-1">
        <div className="overflow-hidden truncate">{video.filename}</div>
      </div>
    </div>
  );
}
