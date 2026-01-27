import { RECORDING_CHUNK_INTERVAL_MS } from "@/lib/constants";
import { logger } from "./logger";

/**
 * Manages media recording with chunk-based storage to prevent memory issues
 */
export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onDataAvailableCallback: ((data: Blob) => void) | null = null;

  /**
   * Starts recording from the provided media stream
   * @param stream - MediaStream to record from
   * @param onDataAvailable - Callback fired when chunk data is available
   * @returns The MediaRecorder instance
   */
  startRecording(stream: MediaStream, onDataAvailable: (data: Blob) => void) {
    try {
      this.chunks = [];
      this.onDataAvailableCallback = onDataAvailable;

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.onDataAvailableCallback?.(event.data);
        }
      };

      // Record in 1-minute chunks to prevent memory issues
      this.mediaRecorder.start(RECORDING_CHUNK_INTERVAL_MS);
      return this.mediaRecorder;
    } catch (error) {
      logger.error("Failed to start recording", error);
      throw error;
    }
  }

  /**
   * Stops the current recording and returns the complete recording as a Blob
   * @returns Promise that resolves with the complete recording Blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const finalBlob = new Blob(this.chunks, { type: "video/webm" });
          this.chunks = [];
          resolve(finalBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  pauseRecording() {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Gets the current state of the recording
   * @returns Current recording state with metrics
   */
  getRecordingState(): RecordingState {
    return {
      isRecording: this.mediaRecorder?.state === "recording",
      isPaused: this.mediaRecorder?.state === "paused",
      duration: this.calculateDuration(),
      chunks: this.chunks.length,
      totalSize: this.calculateTotalSize(),
    };
  }

  private calculateDuration(): number {
    // Approximate duration based on chunks (in seconds)
    return this.chunks.length * (RECORDING_CHUNK_INTERVAL_MS / 1000);
  }

  private calculateTotalSize(): number {
    return this.chunks.reduce((total, chunk) => total + chunk.size, 0);
  }

  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.onDataAvailableCallback = null;
  }
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  chunks: number;
  totalSize: number;
}
