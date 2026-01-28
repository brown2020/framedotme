import type { VideoMetadata } from "@/types/video";
import type { UploadProgress } from "@/types/recorder";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { AppError } from "@/types/errors";
import { MAX_RECORDING_FILE_SIZE } from "@/constants/recording";
import { auth, db, storage } from "@/firebase/firebaseClient";
import { getUserRecordingsPath, LEGACY_RECORDINGS_COLLECTION } from "@/lib/firestore";
import { firestoreRead, firestoreWrite } from "@/lib/firestoreOperations";
import { validateFilename, validateUserId } from "@/lib/validation";
import { downloadFromUrl } from "@/utils/downloadUtils";

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
 * recordings.forEach(video => logger.debug(video.filename));
 * ```
 */
export async function fetchUserRecordings(userId: string): Promise<VideoMetadata[]> {
  const validatedUserId = validateUserId(userId);
  
  return firestoreRead(
    async () => {
      const videosRef = collection(db, getUserRecordingsPath(validatedUserId));
      const q = query(videosRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc): VideoMetadata => {
        const data = doc.data();
        return {
          id: doc.id || data.id || "",
          downloadUrl: data.downloadUrl || "",
          storagePath: data.storagePath || "",
          createdAt: data.createdAt || Timestamp.now(),
          filename: data.filename || "",
          showOnProfile: data.showOnProfile || false,
        };
      });
    },
    'Failed to fetch user recordings',
    { userId: validatedUserId }
  );
}

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
export async function uploadRecording(
  userId: string,
  videoBlob: Blob,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const validatedUserId = validateUserId(userId);
  const validatedFilename = validateFilename(filename);

  // Validate blob size and type
  if (videoBlob.size > MAX_RECORDING_FILE_SIZE) {
    throw new AppError(
      'Video file is too large. Maximum size is 500MB',
      'validation',
      { 
        stage: 'upload-init',
        field: 'videoBlob',
        value: videoBlob.size,
        context: { maxSize: MAX_RECORDING_FILE_SIZE }
      }
    );
  }

  if (!videoBlob.type.startsWith('video/')) {
    throw new AppError(
      'Invalid file type. Only video files are allowed',
      'validation',
      { 
        stage: 'upload-init',
        field: 'videoBlob',
        value: videoBlob.type,
        context: { expectedType: 'video/*' }
      }
    );
  }

  onProgress?.({ progress: 0, status: "starting" });

  try {
    // Storage path uses legacy collection name for backwards compatibility with existing data
    const filePath = `${validatedUserId}/${LEGACY_RECORDINGS_COLLECTION}/${validatedFilename}`;
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
          const storageError = new AppError(
            'Failed to upload recording to storage',
            'storage',
            { 
              stage: 'storage-upload',
              originalError: error as Error,
              context: { userId: validatedUserId, filename: validatedFilename }
            }
          );
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
            const firestoreError = new AppError(
              'Failed to create Firestore record for upload',
              'storage',
              { 
                stage: 'firestore-write',
                originalError: error as Error,
                context: { userId: validatedUserId, filename: validatedFilename }
              }
            );
            reject(firestoreError);
          }
        }
      );
    });
  } catch (error) {
    const initError = new AppError(
      'Failed to initialize upload',
      'storage',
      { 
        stage: 'upload-init',
        originalError: error as Error,
        context: { userId: validatedUserId, filename: validatedFilename }
      }
    );
    onProgress?.({
      progress: 0,
      status: "error",
      error: initError,
    }    );
    throw initError;
  }
}

/**
 * Creates a Firestore record for an uploaded recording
 * 
 * @param userId - The user's unique identifier
 * @param filename - The uploaded file's name
 * @param downloadUrl - The Firebase Storage download URL
 * @throws {StorageError} If Firestore write fails
 * @internal
 */
async function createFirestoreRecord(
  userId: string,
  filename: string,
  downloadUrl: string
): Promise<void> {
  const recordingRef = doc(db, `${getUserRecordingsPath(userId)}/${filename}`);
  // Storage path uses legacy collection name for backwards compatibility with existing data
  const storagePath = `${userId}/${LEGACY_RECORDINGS_COLLECTION}/${filename}`;

  const metadata: VideoMetadata = {
    id: recordingRef.id,
    downloadUrl,
    storagePath,
    createdAt: Timestamp.now(),
    filename,
    showOnProfile: false,
  };

  // Refresh token before write to ensure auth is valid
  // This is critical for multi-window scenarios (video controls in popup)
  // where auth state may not be fully synchronized across windows
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }

  await firestoreWrite(
    () => setDoc(recordingRef, metadata),
    'Failed to write to Firestore: authentication or security rules denied access',
    {
      path: recordingRef.path,
      authUid: auth.currentUser?.uid ?? 'null',
      userId,
      filename
    }
  );
}

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
export async function deleteRecording(
  userId: string,
  video: VideoMetadata
): Promise<void> {
  const validatedUserId = validateUserId(userId);

  await firestoreWrite(
    async () => {
      // Delete from storage using the stored storage path
      const storageRef = ref(storage, video.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, getUserRecordingsPath(validatedUserId), video.id));
    },
    'Failed to delete recording',
    { userId: validatedUserId, videoId: video.id }
  );
}

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
export async function downloadRecording(video: VideoMetadata): Promise<void> {
  const filename = video.filename || "recording_video.webm";
  await downloadFromUrl(video.downloadUrl, filename);
};

