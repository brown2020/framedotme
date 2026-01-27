import { MediaStreamError } from "../types/mediaStreamTypes";
import type { RecorderStatusType } from "../types/recorder";
import { logger } from "@/utils/logger";
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
          "Failed to access screen capture: permission denied",
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
          "Failed to access microphone: permission denied",
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

  /**
   * Creates a combined stream from screen and optional microphone audio
   * 
   * Audio handling strategy:
   * 1. If screen share includes audio (e.g., "Share tab" with audio), use it exclusively
   * 2. If screen share has no audio (e.g., "Share window"), attempt to add microphone
   * 3. Use Web Audio API to mix multiple audio sources when needed
   * 
   * This approach minimizes user friction while providing best audio quality
   */
  async createCombinedStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      throw new MediaStreamError("Failed to create combined stream: screen stream not initialized", "stream");
    }

    try {
      const hasScreenAudio = this.screenStream.getAudioTracks().length > 0;
      
      if (hasScreenAudio) {
        return this.useScreenAudioOnly();
      }

      return await this.createMixedAudioStream();
    } catch (error) {
      throw new MediaStreamError(
        "Failed to combine media streams",
        "stream",
        error as Error
      );
    }
  }

  /**
   * Use screen audio exclusively without requesting microphone
   * Avoids extra permission prompts and audio mixing complexity
   */
  private useScreenAudioOnly(): MediaStream {
    logger.info("Using screen audio, skipping microphone request");
    this.combinedStream = this.screenStream;
    return this.combinedStream!;
  }

  /**
   * Create mixed audio stream with optional microphone fallback
   * Attempts to add microphone when screen has no audio, but continues without it if unavailable
   */
  private async createMixedAudioStream(): Promise<MediaStream> {
    // Clean up any existing AudioContext before creating a new one
    if (this.audioContext) {
      // Close with timeout to prevent hanging
      const closeTimeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          logger.warn("AudioContext close timed out, proceeding anyway");
          resolve();
        }, 1000); // 1 second timeout
      });
      
      await Promise.race([
        this.audioContext.close().catch((error) => {
          // Context may already be closed - log but continue
          logger.warn("AudioContext close error (continuing)", error);
        }),
        closeTimeout
      ]);
    }
    
    this.audioContext = new AudioContext();
    const destination = this.audioContext.createMediaStreamDestination();
    const streams: MediaStream[] = [this.screenStream!];

    // Attempt to add microphone - optional, continues without it if unavailable
    if (!this.micStream) {
      logger.info("No screen audio detected, attempting to add microphone");
      try {
        const micStream = await this.initializeMicrophoneCapture();
        streams.push(micStream);
      } catch (error) {
        logger.warn("Microphone not available, continuing without mic audio", error);
      }
    }

    // Connect all audio sources using Web Audio API
    streams.forEach((stream) => {
      if (stream.getAudioTracks().length > 0) {
        const source = this.audioContext!.createMediaStreamSource(stream);
        source.connect(destination);
      }
    });

    // Combine video from screen with mixed audio tracks
    const videoTrack = this.screenStream!.getVideoTracks()[0];
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
      // Fire-and-forget: AudioContext cleanup errors are non-critical
      void this.audioContext.close().catch((error) => {
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
