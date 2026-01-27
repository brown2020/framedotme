/**
 * Screen recorder type definitions
 */

/**
 * Status of the screen recorder state machine
 * 
 * Flow: idle → ready → shouldStart → recording → shouldStop → saving → ready
 */
export type RecorderStatusType =
  | "idle"        // Not initialized
  | "ready"       // Initialized and ready to record
  | "shouldStart" // Signal to start recording (cross-window sync)
  | "shouldStop"  // Signal to stop recording (cross-window sync)
  | "starting"    // Transitioning to recording state
  | "recording"   // Actively recording
  | "saving"      // Processing and saving recording
  | "error"       // Error occurred
  | "unknown";    // Unclassified state

/**
 * Progress information for file upload operations
 */
export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Current status of the upload operation */
  status: "starting" | "uploading" | "completed" | "error";
  /** Error object if status is "error" */
  error?: Error;
}
