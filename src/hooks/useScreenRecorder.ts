import { db, storage } from "@/firebase/firebaseClient";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";

import { doc, serverTimestamp, setDoc } from "@firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "@firebase/storage";
import { useState, useRef, useEffect, useCallback } from "react";

let renderCount = 0;

const useScreenRecorder = () => {
  const { recorderStatus, updateStatus } = useRecorderStatusStore();
  const [isRecordingWindowOpen, setIsRecordingWindowOpen] = useState(false);
  const screenStream = useRef<MediaStream | null>(null);
  const screenRecorder = useRef<MediaRecorder | null>(null);
  const screenChunks = useRef<Blob[]>([]);
  const filenamePartRef = useRef<string | null>(null);
  const { uid } = useAuthStore();

  console.log("rendering useScreenRecorder:", renderCount++, recorderStatus);

  const generateFilename = (mp4IsSupported: boolean): string => {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[-T:.Z]/g, "");
    const random = Math.floor(Math.random() * 1000);
    const fileExtension = mp4IsSupported ? "mp4" : "webm";
    return `video_${timestamp}_${random}.${fileExtension}`;
  };

  const uploadVideoToFirebase = useCallback(
    async (videoBlob: Blob, filename: string) => {
      if (!uid) return;

      const storageRef = ref(storage, `${uid}/botcasts/${filename}`);
      const uploadTask = uploadBytesResumable(storageRef, videoBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error uploading video: ", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          const botcastRef = doc(db, `users/${uid}/botcasts/${filename}`);
          await setDoc(botcastRef, {
            id: botcastRef.id,
            downloadUrl: downloadURL || "",
            createdAt: serverTimestamp(),
            filename: filename || "recording",
          });
        }
      );
    },
    [uid]
  );

  const saveVideo = useCallback(
    (mp4IsSupported: boolean) => {
      filenamePartRef.current = generateFilename(mp4IsSupported);
      const mimeType = mp4IsSupported ? "video/mp4" : "video/webm";
      const blob = new Blob(screenChunks.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      uploadVideoToFirebase(blob, filenamePartRef.current);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filenamePartRef.current || "recording";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      screenChunks.current = [];
    },
    [uploadVideoToFirebase]
  );

  const startRecording = useCallback(async () => {
    if (!screenStream.current) {
      return;
    }

    updateStatus("starting");
    try {
      const scrStream = screenStream.current;
      console.log("Screen stream set:", screenStream.current);

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();
      [scrStream, micStream].forEach((stream) => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(dest);
      });

      const combinedStream = new MediaStream([
        ...scrStream.getVideoTracks(),
        dest.stream.getAudioTracks()[0],
      ]);
      screenRecorder.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm",
      });
      screenRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          screenChunks.current.push(event.data);
        }
      };
      screenRecorder.current.onstop = () => saveVideo(false);
      screenRecorder.current.start(10 * 60 * 1000); // 10 minutes
      updateStatus("recording");
    } catch (error) {
      console.error("Error starting the recording:", error);
      updateStatus("error");
    }
  }, [saveVideo, updateStatus]);

  const stopRecording = useCallback(() => {
    updateStatus("saving");
    screenRecorder.current?.stop();

    if (screenStream.current && screenStream.current.active) {
      updateStatus("ready");
    } else {
      updateStatus("idle");
      setIsRecordingWindowOpen(false);
    }
  }, [updateStatus]);

  useEffect(() => {
    switch (recorderStatus) {
      case "shouldStart":
        startRecording();
        break;
      case "shouldStop":
        stopRecording();
        break;
    }
  }, [recorderStatus, startRecording, stopRecording]);

  const initializeRecorder = async () => {
    if (isRecordingWindowOpen) {
      console.log("Recording window is already open.");
      return;
    }

    try {
      const scrStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      scrStream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log("Screen sharing stopped");
          setIsRecordingWindowOpen(false); // Update state when the track ends
          updateStatus("idle");
        };
      });

      screenStream.current = scrStream;
      console.log("Screen stream initialized:", screenStream.current);
      setIsRecordingWindowOpen(true);
      updateStatus("ready");
    } catch (error) {
      console.error("Error initializing the recording:", error);
      updateStatus("error");
    }
  };

  const resetRecorder = useCallback(() => {
    // Stop and clear the screen stream tracks
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
    }

    // Clear the MediaRecorder
    screenRecorder.current = null;

    // Clear the recorded chunks
    screenChunks.current = [];
    filenamePartRef.current = null;

    updateStatus("idle");
    setIsRecordingWindowOpen(false);

    console.log("Recorder has been reset");
  }, [updateStatus]);

  return {
    recorderStatus,
    updateStatus,
    initializeRecorder,
    startRecording,
    stopRecording,
    screenStream,
    resetRecorder,
  };
};

export default useScreenRecorder;
