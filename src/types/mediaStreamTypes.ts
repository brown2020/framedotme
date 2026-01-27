/**
 * Media stream type definitions and error handling
 */

/**
 * Type of media stream error that occurred
 */
export type MediaStreamErrorType =
  | "permission"  // User denied permission to access media device
  | "device"      // Hardware/device access failure
  | "stream"      // Stream processing or combination error
  | "unknown";    // Unclassified error

/**
 * Custom error class for media stream operations
 * Provides context about the type of error and preserves the original error
 */
export class MediaStreamError extends Error {
  constructor(
    message: string,
    public readonly type: MediaStreamErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "MediaStreamError";
    Object.setPrototypeOf(this, MediaStreamError.prototype);
  }
}

/**
 * Interface for media stream control state
 */
export interface MediaStreamControls {
  /** Whether any media stream is currently active */
  isActive: boolean;
  /** Reference to the current screen capture stream, if any */
  currentScreenStream: MediaStream | null;
}
