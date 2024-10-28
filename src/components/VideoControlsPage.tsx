"use client";

import useScreenRecorder from "@/hooks/useScreenRecorder";
import React, { useEffect, useRef, useState } from "react";

export default function VideoControlsPage() {
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const { recorderStatus, initializeRecorder, screenStream, resetRecorder } =
    useScreenRecorder();
  const screenVideoElem = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const currentScreenVideoElem = screenVideoElem.current;

    const updateVideoDimensions = () => {
      const ratio = window.devicePixelRatio || 1;
      if (currentScreenVideoElem) {
        setVideoWidth(Math.round(currentScreenVideoElem.videoWidth / ratio));
        setVideoHeight(Math.round(currentScreenVideoElem.videoHeight / ratio));
      }
    };

    const handleLoadedMetadata = () => {
      updateVideoDimensions();
    };

    if (currentScreenVideoElem && screenStream.current) {
      currentScreenVideoElem.srcObject = screenStream.current;
      currentScreenVideoElem.play();
      currentScreenVideoElem.addEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    }

    const intervalId = setInterval(updateVideoDimensions, 500);

    return () => {
      if (currentScreenVideoElem) {
        currentScreenVideoElem.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      }
      clearInterval(intervalId);
    };
  }, [screenStream, recorderStatus]);

  const buttonText =
    recorderStatus === "idle" ? "Initialize Recording" : recorderStatus;

  const buttonDisabled =
    recorderStatus === "ready" ||
    recorderStatus === "shouldStart" ||
    recorderStatus === "shouldStop" ||
    recorderStatus === "starting" ||
    recorderStatus === "recording" ||
    recorderStatus === "saving";

  const buttonClass = `px-4 py-2 w-40 text-white rounded-md mr-auto disabled:opacity-50 w-full ${
    recorderStatus === "recording" ? "bg-red-500" : "bg-green-500"
  }`;

  return (
    <div className="flex flex-col space-y-3 h-full p-4">
      <div className="text-2xl">Video Controls</div>
      <p>Status from Local Storage: {recorderStatus}</p>
      <p>
        Please go back to the main tab and interact as needed. Control your
        recording here:
      </p>
      <button
        className={buttonClass}
        onClick={initializeRecorder}
        disabled={buttonDisabled}
      >
        {buttonText}
      </button>

      <button className="btn bg-green-500" onClick={resetRecorder}>
        Reset
      </button>

      <div className="w-full border mr-auto">
        <video
          ref={screenVideoElem}
          className="w-full h-full object-contain"
          autoPlay
          muted
          controls
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col">
          <div>Width: {videoWidth}px</div>
          <div>Height: {videoHeight}px</div>
          <div>
            Aspect:{" "}
            {videoWidth && videoHeight
              ? (videoWidth / videoHeight).toFixed(2)
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
