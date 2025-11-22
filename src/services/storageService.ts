import { db, storage } from "@/firebase/firebaseClient";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { 
  doc, 
  setDoc, 
  Timestamp, 
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs
} from "firebase/firestore";
import { downloadFromUrl } from "@/utils/downloadUtils";
import { VideoMetadata } from "@/types/video";

export interface UploadProgress {
  progress: number;
  status: "starting" | "uploading" | "completed" | "error";
  error?: Error;
}

export const fetchUserRecordings = async (userId: string): Promise<VideoMetadata[]> => {
  const videosRef = collection(db, `users/${userId}/botcasts`);
  const q = query(videosRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
      id: doc.id || doc.data().id || "",
      downloadUrl: doc.data().downloadUrl || "",
      createdAt: doc.data().createdAt || Timestamp.now(),
      filename: doc.data().filename || "",
      showOnProfile: doc.data().showOnProfile || false,
      botId: doc.data().botId || "",
      botName: doc.data().botName || "",
      modelId: doc.data().modelId || "",
      modelName: doc.data().modelName || "",
      language: doc.data().language || "",
      languageCode: doc.data().languageCode || "",
    })) as VideoMetadata[];
};

export const uploadRecording = async (
  userId: string,
  videoBlob: Blob,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  if (!userId) {
    throw new Error("User ID is required for upload");
  }

  onProgress?.({ progress: 0, status: "starting" });

  try {
    const filePath = `${userId}/botcasts/${filename}`;
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
            await createFirestoreRecord(userId, filename, downloadURL);
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
};

const createFirestoreRecord = async (
  userId: string,
  filename: string,
  downloadUrl: string
) => {
  const botcastRef = doc(db, `users/${userId}/botcasts/${filename}`);

  const metadata: VideoMetadata = {
    id: botcastRef.id,
    downloadUrl,
    createdAt: Timestamp.now(),
    filename,
    showOnProfile: false,
  };

  await setDoc(botcastRef, metadata);
};

export const deleteRecording = async (
  userId: string,
  video: VideoMetadata
): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required for deletion");
  }

  try {
    // Delete from storage
    if (video.filename && video.filename !== "no filename") {
      const filePath = `${userId}/botcasts/${video.filename}`;
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } else {
      const storageRef = ref(storage, video.downloadUrl);
      await deleteObject(storageRef);
    }

    // Delete from Firestore
    await deleteDoc(doc(db, `users/${userId}/botcasts`, video.id));
  } catch (error) {
    console.error("Error deleting recording:", error);
    throw error;
  }
};

export const downloadRecording = async (video: VideoMetadata): Promise<void> => {
  const filename =
    video.filename && video.filename !== "no filename"
      ? video.filename
      : "botcasting_video.webm";
      
  await downloadFromUrl(video.downloadUrl, filename);
};

