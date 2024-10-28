import { createRef } from "react";

// Initialize globalAudioElement conditionally
export const globalAudioElement =
  typeof window !== "undefined" ? new Audio() : null;
export const globalVideoRef = createRef<HTMLVideoElement>();

export const resetAudio = () => {
  if (!globalAudioElement) return;
  globalAudioElement.pause();
  globalAudioElement.src = "";
  globalAudioElement.currentTime = 0;
  if (globalAudioElement.load) globalAudioElement.load();
  globalAudioElement.onended = null;
};

export const resetVideo = () => {
  if (!globalVideoRef.current) return;
  globalVideoRef.current.pause();
  globalVideoRef.current.currentTime = 0;
  globalVideoRef.current.volume = 0.0;
  globalVideoRef.current.muted = true;
};

export const playAudio = (audioSrc: string, onEndCallback = () => {}) => {
  if (!globalAudioElement) return;

  try {
    resetVideo();
    resetAudio();
    globalAudioElement.src = audioSrc;
    globalAudioElement.volume = 1.0;
    globalAudioElement.onended = () => {
      onEndCallback();
      globalAudioElement.src = "";
    };
    if (globalAudioElement.load) globalAudioElement.load();
    globalAudioElement.play();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Audio play error:", error.message);
    } else {
      console.error("Audio play error: Unknown error", error);
    }
  }
};

export const primeAudio = () => {
  const silentData =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  playAudio(silentData);
};
