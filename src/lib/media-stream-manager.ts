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

  /**
   * Creates a new MediaStreamManager instance
   * 
   * @param statusCallback - Optional callback to receive recorder status updates
   */
  constructor(statusCallback?: (status: RecorderStatusType) => void) {
    this.statusCallback = statusCallback;
  }

  private updateStatus(status: RecorderStatusType) {
    this.statusCallback?.(status);
  }

  /**
   * Initializes screen capture with video and optional audio
   * 
   * @returns Promise resolving to the screen capture MediaStream
   * @throws {MediaStreamError} If permission denied or device access fails
   * 
   * @example
   * ```typescript
   * const manager = new MediaStreamManager();
   * const stream = await manager.initializeScreenCapture();
   * ```
   */
  async initializeScreenCapture(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: RECORDING_FRAME_RATE },
        },
        // Request audio without constraints because browser handles tab audio sharing
        // automatically, and additional constraints can cause permission dialogs to fail
        audio: true,
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

  /**
   * Initializes microphone capture with echo cancellation and noise suppression
   * 
   * @returns Promise resolving to the microphone MediaStream
   * @throws {MediaStreamError} If permission denied or microphone access fails
   */
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
          void this.cleanup();
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
   * Creates a combined stream from screen and microphone audio
   * 
   * Audio handling strategy:
   * - ALWAYS attempts to add microphone audio for voice narration
   * - Mixes microphone with screen audio (if present) using Web Audio API
   * - If microphone unavailable, continues with screen audio only
   * 
   * This ensures both system audio AND microphone are captured together
   */
  async createCombinedStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      throw new MediaStreamError("Failed to create combined stream: screen stream not initialized", "stream");
    }

    try {
      // Always attempt to mix audio - this allows capturing BOTH mic and system audio
      return await this.createStreamWithMixedAudio();
    } catch (error) {
      throw new MediaStreamError(
        "Failed to combine media streams",
        "stream",
        error as Error
      );
    }
  }

  /**
   * Creates stream with mixed audio from screen and microphone
   * ALWAYS attempts to add microphone for voice narration
   * Mixes microphone + screen audio (if present) via Web Audio API
   * 
   * Note: Caller ensures screenStream is non-null before calling this method
   */
  private async createStreamWithMixedAudio(): Promise<MediaStream> {
    // screenStream is guaranteed non-null by createCombinedStream check
    if (!this.screenStream) {
      throw new MediaStreamError("screenStream is null in createMixedAudioStream", "stream");
    }

    const hasScreenAudio = this.screenStream.getAudioTracks().length > 0;

    // Close existing AudioContext to prevent memory leaks from abandoned contexts
    // Each context consumes system audio resources even when not actively used
    if (this.audioContext) {
      await this.audioContext.close().catch((error) => {
        // Context may already be closed - log but continue
        logger.warn("AudioContext close error (continuing)", error);
      });
    }
    
    this.audioContext = new AudioContext();
    const audioContext = this.audioContext; // Local reference for TypeScript
    const destination = audioContext.createMediaStreamDestination();
    const streams: MediaStream[] = [this.screenStream];

    // ALWAYS attempt to add microphone for voice narration
    // This allows recording BOTH system audio AND microphone together
    if (!this.micStream) {
      if (hasScreenAudio) {
        logger.info("Screen has audio - adding microphone to mix both sources");
      } else {
        logger.info("No screen audio - adding microphone for voice");
      }
      
      try {
        const micStream = await this.initializeMicrophoneCapture();
        streams.push(micStream);
        logger.info("✅ Microphone added successfully");
      } catch (error) {
        logger.warn("Microphone not available, continuing with screen audio only", error);
      }
    }

    // Connect all audio sources using Web Audio API
    streams.forEach((stream) => {
      if (stream.getAudioTracks().length > 0) {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(destination);
      }
    });

    // Combine video from screen with mixed audio tracks
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
  }

  /**
   * Cleans up all media streams and releases system resources
   * Stops all tracks, removes event listeners, and closes audio context
   */
  async cleanup(): Promise<void> {
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
      try {
        await this.audioContext.close();
      } catch (error) {
        logger.warn("Failed to close AudioContext", error);
      }
      this.audioContext = null;
    }

    this.screenStream = null;
    this.micStream = null;
    this.combinedStream = null;
  }

  /**
   * Checks if any media stream is currently active
   * 
   * @returns True if screen or combined stream is active
   */
  get isActive(): boolean {
    return Boolean(this.screenStream?.active || this.combinedStream?.active);
  }

  /**
   * Gets the current screen capture stream
   * 
   * @returns The screen MediaStream or null if not initialized
   */
  get currentScreenStream(): MediaStream | null {
    return this.screenStream;
  }
}
