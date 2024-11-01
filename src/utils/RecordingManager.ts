// utils/RecordingManager.ts
export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onDataAvailableCallback: ((data: Blob) => void) | null = null;

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
      this.mediaRecorder.start(60 * 1000);
      return this.mediaRecorder;
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

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
    // Approximate duration based on chunks
    return this.chunks.length * 60; // since we're recording in 60-second chunks
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
