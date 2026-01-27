import { MediaStreamError } from "../types/mediaStreamTypes";
import { RecorderStatusType } from "../types/recorder";
import { logger } from "./logger";
import { RECORDING_FRAME_RATE } from "@/constants/recording";

export class MediaStreamManager {
  private screenStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private statusCallback?: (status: RecorderStatusType) => void;
  private trackListeners: Map<MediaStreamTrack, {
    onended: () => void;
    onmute: () => void;
    onunmute: () => void;
  }> = new Map();

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
          frameRate: { ideal: RECORDING_FRAME_RATE },
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
      const handlers = {
        onended: () => {
          this.updateStatus("idle");
          this.cleanup();
        },
        onmute: () => {
          logger.warn(`Track muted: ${track.kind}`);
        },
        onunmute: () => {
          logger.info(`Track unmuted: ${track.kind}`);
        },
      };

      track.onended = handlers.onended;
      track.onmute = handlers.onmute;
      track.onunmute = handlers.onunmute;

      this.trackListeners.set(track, handlers);
    });
  }

  async createCombinedStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      throw new MediaStreamError("Screen stream not initialized", "stream");
    }

    try {
      // Check if screen stream already has audio
      const hasScreenAudio = this.screenStream.getAudioTracks().length > 0;
      
      // If screen stream has audio, just use it directly without requesting mic
      if (hasScreenAudio) {
        logger.info("Using screen audio, skipping microphone request");
        this.combinedStream = this.screenStream;
        return this.combinedStream;
      }

      // If no screen audio, create combined stream with optional mic
      // Clean up any existing AudioContext before creating a new one
      if (this.audioContext) {
        await this.audioContext.close().catch(() => {});
      }
      
      this.audioContext = new AudioContext();
      const destination = this.audioContext.createMediaStreamDestination();
      const streams: MediaStream[] = [this.screenStream];

      // Only try to add mic if screen has no audio (avoid double permission prompt)
      if (!hasScreenAudio && !this.micStream) {
        logger.info("No screen audio detected, attempting to add microphone");
        try {
          const micStream = await this.initializeMicrophoneCapture();
          streams.push(micStream);
        } catch (error) {
          logger.warn("Microphone not available, continuing without mic audio", error);
          // Continue without mic - not critical
        }
      }

      streams.forEach((stream) => {
        if (stream.getAudioTracks().length > 0) {
          const source = this.audioContext!.createMediaStreamSource(stream);
          source.connect(destination);
        }
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      const audioTracks = destination.stream.getAudioTracks();

      const tracks: MediaStreamTrack[] = [];
      if (videoTrack) {
        tracks.push(videoTrack);
      }
      if (audioTracks.length > 0 && audioTracks[0]) {
        tracks.push(audioTracks[0]);
      }

      this.combinedStream = new MediaStream(tracks);

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
            // Remove event listeners before stopping
            if (this.trackListeners.has(track)) {
              track.onended = null;
              track.onmute = null;
              track.onunmute = null;
              this.trackListeners.delete(track);
            }
            track.stop();
          });
        }
      }
    );

    if (this.audioContext) {
      this.audioContext.close().catch((error) => {
        logger.warn("Failed to close AudioContext", error);
      });
      this.audioContext = null;
    }

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
