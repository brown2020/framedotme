// utils/MediaStreamManager.ts
import { MediaStreamError } from "../types/mediaStreamTypes";
import { RecorderStatusType } from "../types/recorder";

export class MediaStreamManager {
  private screenStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private statusCallback?: (status: RecorderStatusType) => void;

  constructor(statusCallback?: (status: RecorderStatusType) => void) {
    this.statusCallback = statusCallback;
  }

  private updateStatus(status: RecorderStatusType) {
    this.statusCallback?.(status);
  }

  async initializeScreenCapture(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
        },
        audio: true, // Keep this simple for screen share audio
      });

      this.setupTrackListeners(this.screenStream);
      return this.screenStream;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Permission")) {
        throw new MediaStreamError(
          "Screen capture permission denied",
          "permission",
          error as Error
        );
      } else {
        throw new MediaStreamError(
          "Failed to initialize screen capture",
          "device",
          error as Error
        );
      }
    }
  }

  async initializeMicrophoneCapture(): Promise<MediaStream> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });

      return this.micStream;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Permission")) {
        throw new MediaStreamError(
          "Microphone permission denied",
          "permission",
          error as Error
        );
      } else {
        throw new MediaStreamError(
          "Failed to initialize microphone",
          "device",
          error as Error
        );
      }
    }
  }

  private setupTrackListeners(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        this.updateStatus("idle");
        this.cleanup();
      };

      track.onmute = () => {
        console.warn("Track muted:", track.kind);
      };

      track.onunmute = () => {
        console.info("Track unmuted:", track.kind);
      };
    });
  }

  async createCombinedStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      throw new MediaStreamError("Screen stream not initialized", "stream");
    }

    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add screen audio if available
      const streams: MediaStream[] = [this.screenStream];

      // Try to add mic audio
      try {
        const micStream = await this.initializeMicrophoneCapture();
        streams.push(micStream);
      } catch (error) {
        console.warn("Microphone not available:", error);
        // Continue without mic
      }

      streams.forEach((stream) => {
        if (stream.getAudioTracks().length > 0) {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        }
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      const audioTracks = destination.stream.getAudioTracks();

      this.combinedStream = new MediaStream([
        videoTrack,
        ...(audioTracks.length > 0 ? [audioTracks[0]] : []),
      ]);

      return this.combinedStream;
    } catch (error) {
      throw new MediaStreamError(
        "Failed to combine media streams",
        "stream",
        error as Error
      );
    }
  }

  cleanup() {
    [this.screenStream, this.micStream, this.combinedStream].forEach(
      (stream) => {
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
            stream.removeTrack(track);
          });
        }
      }
    );

    this.screenStream = null;
    this.micStream = null;
    this.combinedStream = null;
  }

  get isActive(): boolean {
    return Boolean(this.screenStream?.active || this.combinedStream?.active);
  }

  get currentScreenStream(): MediaStream | null {
    return this.screenStream;
  }
}
