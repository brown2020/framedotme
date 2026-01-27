import { Timestamp } from "firebase/firestore";

/**
 * Metadata for a recorded video
 * Stored in Firestore alongside the video file in Firebase Storage
 */
export interface VideoMetadata {
  /** Unique identifier for the video (matches Firestore document ID) */
  id: string;
  /** Public download URL for the video file */
  downloadUrl: string;
  /** Storage path in Firebase Storage */
  storagePath: string;
  /** Timestamp when the video was created */
  createdAt: Timestamp;
  /** Original filename of the video */
  filename: string;
  /** Whether to display this video on the user's profile */
  showOnProfile?: boolean;
}
