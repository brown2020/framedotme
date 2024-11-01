// utils/StorageManager.ts
import { db, storage } from "@/firebase/firebaseClient";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "@firebase/storage";
import { doc, setDoc, Timestamp, deleteDoc } from "firebase/firestore";

export interface UploadProgress {
  progress: number;
  status: "starting" | "uploading" | "completed" | "error";
  error?: Error;
}

export interface VideoMetadata {
  id: string;
  downloadUrl: string;
  createdAt: Timestamp;
  filename: string;
  showOnProfile?: boolean;
  botId?: string;
  botName?: string;
  modelId?: string;
  modelName?: string;
  language?: string;
  languageCode?: string;
}

export class StorageManager {
  constructor(private readonly userId: string) {}

  async uploadRecording(
    videoBlob: Blob,
    filename: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!this.userId) {
      throw new Error("User ID is required for upload");
    }

    onProgress?.({ progress: 0, status: "starting" });

    try {
      const filePath = `${this.userId}/botcasts/${filename}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, videoBlob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              progress,
              status: "uploading",
            });
          },
          (error) => {
            onProgress?.({
              progress: 0,
              status: "error",
              error: error as Error,
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await this.createFirestoreRecord(filename, downloadURL);
              onProgress?.({
                progress: 100,
                status: "completed",
              });
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      onProgress?.({
        progress: 0,
        status: "error",
        error: error as Error,
      });
      throw error;
    }
  }

  private async createFirestoreRecord(filename: string, downloadUrl: string) {
    const botcastRef = doc(db, `users/${this.userId}/botcasts/${filename}`);

    const metadata: VideoMetadata = {
      id: botcastRef.id,
      downloadUrl,
      createdAt: Timestamp.now(),
      filename,
      showOnProfile: false,
    };

    await setDoc(botcastRef, metadata);
  }

  async deleteRecording(video: VideoMetadata): Promise<void> {
    if (!this.userId) {
      throw new Error("User ID is required for deletion");
    }

    try {
      // Delete from storage
      if (video.filename && video.filename !== "no filename") {
        const filePath = `${this.userId}/botcasts/${video.filename}`;
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      } else {
        const storageRef = ref(storage, video.downloadUrl);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, `users/${this.userId}/botcasts`, video.id));
    } catch (error) {
      console.error("Error deleting recording:", error);
      throw error;
    }
  }

  async downloadRecording(video: VideoMetadata): Promise<void> {
    try {
      const response = await fetch(video.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download =
        video.filename && video.filename !== "no filename"
          ? video.filename
          : "botcasting_video.webm";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the video:", error);
      throw error;
    }
  }
}
