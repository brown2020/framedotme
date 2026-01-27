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
import { logger } from "@/utils/logger";
import { StorageError } from "@/types/errors";
import { validateUserId, validateFilename } from "@/lib/validation";
import { getUserBotcastsPath } from "@/lib/firestore";

/**
 * Fetches all recordings for a specific user from Firestore
 * 
 * @param userId - The authenticated user's unique identifier
 * @returns Promise resolving to array of video metadata sorted by creation date (newest first)
 * @throws {ValidationError} If userId is invalid
 * @throws {StorageError} If Firestore query fails
 * 
 * @example
 * ```typescript
 * const recordings = await fetchUserRecordings(user.uid);
 * recordings.forEach(video => console.log(video.filename));
 * ```
 */
export const fetchUserRecordings = async (userId: string): Promise<VideoMetadata[]> => {
  const validatedUserId = validateUserId(userId);
  
  try {
    const videosRef = collection(db, getUserBotcastsPath(validatedUserId));
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
  } catch (error) {
    throw new StorageError(
      'Failed to fetch user recordings',
      'firestore-write',
      error as Error,
      { userId: validatedUserId }
    );
  }
};

/**
 * Uploads a recording to Firebase Storage and creates a Firestore record
 * 
 * @param userId - The authenticated user's unique identifier
 * @param videoBlob - The video Blob to upload (must be valid video format)
 * @param filename - Name for the uploaded file (should include .webm extension)
 * @param onProgress - Optional callback for upload progress updates
 * @returns Promise resolving to the download URL of the uploaded file
 * @throws {ValidationError} If userId or filename is invalid
 * @throws {StorageError} If upload or Firestore write fails
 * 
 * @example
 * ```typescript
 * const url = await uploadRecording(
 *   user.uid,
 *   recordingBlob,
 *   'video_123.webm',
 *   (progress) => console.log(`${progress.progress}%`)
 * );
 * ```
 */
export const uploadRecording = async (
  userId: string,
  videoBlob: Blob,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const validatedUserId = validateUserId(userId);
  const validatedFilename = validateFilename(filename);

  onProgress?.({ progress: 0, status: "starting" });

  try {
    logger.debug(`uploadRecording: auth.currentUser.uid = ${auth.currentUser?.uid}`);

    const filePath = `${validatedUserId}/botcasts/${validatedFilename}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, videoBlob, {
      contentType: validatedFilename.endsWith(".webm") ? "video/webm" : "video/*",
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
          const storageError = new StorageError(
            'Failed to upload recording to storage',
            'storage-upload',
            error as Error,
            { userId: validatedUserId, filename: validatedFilename }
          );
          logger.error("uploadRecording: Storage upload failed", storageError);
          onProgress?.({
            progress: 0,
            status: "error",
            error: storageError,
          });
          reject(storageError);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await createFirestoreRecord(validatedUserId, validatedFilename, downloadURL);
            onProgress?.({
              progress: 100,
              status: "completed",
            });
            resolve(downloadURL);
          } catch (error) {
            const firestoreError = new StorageError(
              'Failed to create Firestore record for upload',
              'firestore-write',
              error as Error,
              { userId: validatedUserId, filename: validatedFilename }
            );
            logger.error("uploadRecording: Firestore record creation failed", firestoreError);
            reject(firestoreError);
          }
        }
      );
    });
  } catch (error) {
    const initError = new StorageError(
      'Failed to initialize upload',
      'upload-init',
      error as Error,
      { userId: validatedUserId, filename: validatedFilename }
    );
    logger.error("uploadRecording: Failed to initialize upload", initError);
    onProgress?.({
      progress: 0,
      status: "error",
      error: initError,
    });
    throw initError;
  }
};

/**
 * Creates a Firestore record for an uploaded recording
 * 
 * @param userId - The user's unique identifier
 * @param filename - The uploaded file's name
 * @param downloadUrl - The Firebase Storage download URL
 * @throws {StorageError} If Firestore write fails
 * @internal
 */
const createFirestoreRecord = async (
  userId: string,
  filename: string,
  downloadUrl: string
): Promise<void> => {
  const botcastRef = doc(db, `${getUserBotcastsPath(userId)}/${filename}`);

  const metadata: VideoMetadata = {
    id: botcastRef.id,
    downloadUrl,
    createdAt: Timestamp.now(),
    filename,
    showOnProfile: false,
  };

  try {
    // Force token retrieval right before the write (helps in popup/multi-window situations)
    await auth.currentUser?.getIdToken();
    await setDoc(botcastRef, metadata);
  } catch (error) {
    throw new StorageError(
      'Firestore write denied - check authentication and security rules',
      'firestore-write',
      error as Error,
      {
        path: botcastRef.path,
        authUid: auth.currentUser?.uid ?? 'null',
        userId,
        filename
      }
    );
  }
};

/**
 * Deletes a recording from both Firebase Storage and Firestore
 * 
 * @param userId - The authenticated user's unique identifier
 * @param video - Metadata of the video to delete
 * @returns Promise that resolves when deletion is complete
 * @throws {ValidationError} If userId is invalid
 * @throws {StorageError} If deletion from Storage or Firestore fails
 * 
 * @example
 * ```typescript
 * await deleteRecording(user.uid, videoToDelete);
 * ```
 */
export const deleteRecording = async (
  userId: string,
  video: VideoMetadata
): Promise<void> => {
  const validatedUserId = validateUserId(userId);

  try {
    // Delete from storage
    if (video.filename && video.filename !== "no filename") {
      const filePath = `${validatedUserId}/botcasts/${video.filename}`;
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } else {
      const storageRef = ref(storage, video.downloadUrl);
      await deleteObject(storageRef);
    }

    // Delete from Firestore
    await deleteDoc(doc(db, getUserBotcastsPath(validatedUserId), video.id));
  } catch (error) {
    throw new StorageError(
      'Failed to delete recording',
      'storage-delete',
      error as Error,
      { userId: validatedUserId, videoId: video.id }
    );
  }
};

/**
 * Downloads a recording to the user's device
 * 
 * @param video - Metadata of the video to download
 * @returns Promise that resolves when download initiates
 * @throws {Error} If download fails
 * 
 * @example
 * ```typescript
 * await downloadRecording(selectedVideo);
 * ```
 */
export const downloadRecording = async (video: VideoMetadata): Promise<void> => {
  const filename =
    video.filename && video.filename !== "no filename"
      ? video.filename
      : "botcasting_video.webm";
      
  await downloadFromUrl(video.downloadUrl, filename);
};

