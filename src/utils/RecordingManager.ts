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

  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.onDataAvailableCallback = null;
  }
}
