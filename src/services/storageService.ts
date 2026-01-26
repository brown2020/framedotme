import { auth, db, storage } from "@/firebase/firebaseClient";
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
import { UploadProgress } from "@/types/recorder";

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
    // Helpful when debugging popups / multi-window auth issues
    console.debug("[uploadRecording] auth.currentUser?.uid =", auth.currentUser?.uid);

    const filePath = `${userId}/botcasts/${filename}`;
    const storageRef = ref(storage, filePath);
    // Provide explicit contentType so Storage Rules can validate reliably.
    // (Browsers may omit Blob contentType, which otherwise becomes null in rules.)
    const uploadTask = uploadBytesResumable(storageRef, videoBlob, {
      contentType: filename.endsWith(".webm") ? "video/webm" : "video/*",
    });

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
          console.error("[uploadRecording] Storage upload failed:", error);
          try {
            (error as unknown as { stage?: string }).stage = "storage-upload";
          } catch {
            // ignore
          }
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
            console.error("[uploadRecording] Firestore record creation failed:", error);
            try {
              (error as unknown as { stage?: string }).stage = "firestore-botcasts-setDoc";
            } catch {
              // ignore
            }
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("[uploadRecording] Failed to initialize upload:", error);
    try {
      (error as unknown as { stage?: string }).stage = "upload-init";
    } catch {
      // ignore
    }
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

  try {
    // Force token retrieval right before the write (helps in popup/multi-window situations).
    // Do not log the token; just ensure it can be fetched.
    await auth.currentUser?.getIdToken();
    await setDoc(botcastRef, metadata);
  } catch (error) {
    try {
      const anyErr = error as unknown as { stage?: string; debug?: string };
      anyErr.stage = "firestore-botcasts-setDoc";
      anyErr.debug = `path=${botcastRef.path} authUid=${auth.currentUser?.uid ?? "null"} userId=${userId} filename=${filename}`;
    } catch {
      // ignore
    }
    console.error("[createFirestoreRecord] setDoc denied", {
      path: botcastRef.path,
      authUid: auth.currentUser?.uid,
      userId,
      filename,
      error,
    });
    throw error;
  }
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

