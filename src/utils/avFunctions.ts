import { createRef } from "react";
import { logger } from "./logger";

/**
 * Audio manager singleton to handle global audio playback
 * Avoids module-level state by using a getter function
 */
class AudioManager {
  private static instance: HTMLAudioElement | null = null;

  static getAudioElement(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!AudioManager.instance) {
      AudioManager.instance = new Audio();
    }
    return AudioManager.instance;
  }

  static reset(): void {
    const audio = AudioManager.getAudioElement();
    if (!audio) return;
    audio.pause();
    audio.src = "";
    audio.currentTime = 0;
    audio.load();
    audio.onended = null;
  }
}

// Video ref for global video element - exported for use in components
export const globalVideoRef = createRef<HTMLVideoElement>();

export const resetAudio = (): void => {
  AudioManager.reset();
};

export const resetVideo = (): void => {
  if (!globalVideoRef.current) return;
  globalVideoRef.current.pause();
  globalVideoRef.current.currentTime = 0;
  globalVideoRef.current.volume = 0.0;
  globalVideoRef.current.muted = true;
};

export const playAudio = (audioSrc: string, onEndCallback = (): void => {}): void => {
  const audio = AudioManager.getAudioElement();
  if (!audio) return;

  try {
    resetVideo();
    resetAudio();
    audio.src = audioSrc;
    audio.volume = 1.0;
    audio.onended = () => {
      onEndCallback();
      audio.src = "";
    };
    audio.load();
    audio.play();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Audio play error:", error.message);
    } else {
      logger.error("Audio play error: Unknown error", error);
    }
  }
};

export const primeAudio = (): void => {
  const silentData =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  playAudio(silentData);
};
