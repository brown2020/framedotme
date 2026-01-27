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
  /** ID of the bot associated with this video (if applicable) */
  botId?: string;
  /** Name of the bot associated with this video (if applicable) */
  botName?: string;
  /** ID of the model used to generate this video (if applicable) */
  modelId?: string;
  /** Name of the model used to generate this video (if applicable) */
  modelName?: string;
  /** Language of the video content (if applicable) */
  language?: string;
  /** Language code (ISO 639-1) of the video content (if applicable) */
  languageCode?: string;
}
