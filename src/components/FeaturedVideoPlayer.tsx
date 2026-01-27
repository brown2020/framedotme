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
 * 
 * @param props - Component props
 * @returns The featured video player with controls
 */
export function FeaturedVideoPlayer({
  video,
  onClear,
  onDownload,
  onDelete,
}: FeaturedVideoPlayerProps) {
  return (
    <div className="flex flex-col mb-4">
      <div className="flex gap-2 flex-wrap text-xs">
        <div>Created At: {video.createdAt.toDate().toLocaleString()}</div>
        <div>Filename: {video.filename || "No filename"}</div>
      </div>

      <video src={video.downloadUrl} controls className="w-full border" />

      <div className="flex gap-2">
        <a
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
          href={video.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new window
        </a>
        <button
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
          onClick={onClear}
        >
          Clear Featured
        </button>
        <button
          className="text-white bg-blue-500 p-2 rounded-md w-max my-2"
          onClick={() => onDownload(video)}
        >
          Download
        </button>
        <button
          className="text-white bg-red-500 p-2 rounded-md w-max my-2"
          onClick={() => onDelete(video)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
