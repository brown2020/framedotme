import { db } from "@/firebase/firebaseClient";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { deleteUser, getAuth } from "firebase/auth";
import type { ProfileType } from "@/zustand/useProfileStore";
import { logger } from "@/utils/logger";
import { validateUserId } from "@/lib/validation";
import { getUserPath, getUserProfilePath } from "@/lib/firestore";
import { StorageError } from "@/types/errors";

/**
 * Updates user authentication details in Firestore
 * Sanitizes the details object to exclude functions before storing
 * 
 * @param details - Object containing user details to update
 * @param uid - The user's unique identifier
 * @returns Promise that resolves when update is complete
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * await updateUserDetailsInFirestore({ authEmail: 'user@example.com' }, user.uid);
 * ```
 */
export const updateUserDetailsInFirestore = async (
  details: Record<string, unknown>,
  uid: string
): Promise<void> => {
  const validatedUid = validateUserId(uid);
  const userRef = doc(db, getUserPath(validatedUid));

  // Sanitize the details object to exclude any functions
  const sanitizedDetails = { ...details };

  // Remove any unexpected functions or properties
  Object.keys(sanitizedDetails).forEach((key) => {
    if (typeof sanitizedDetails[key] === "function") {
      delete sanitizedDetails[key];
    }
  });

  try {
    await setDoc(
      userRef,
      { ...sanitizedDetails, lastSignIn: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    logger.error("Error updating auth details in Firestore", error);
    throw new StorageError(
      'Failed to update user details',
      'firestore-write',
      error as Error,
      { userId: validatedUid }
    );
  }
};

/**
 * Fetches a user's profile from Firestore
 * 
 * @param uid - The user's unique identifier
 * @returns Promise resolving to the user's profile or null if not found
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * const profile = await fetchUserProfile(user.uid);
 * if (profile) logger.debug(profile.displayName);
 * ```
 */
export const fetchUserProfile = async (uid: string): Promise<ProfileType | null> => {
  const validatedUid = validateUserId(uid);
  
  try {
    const userRef = doc(db, getUserProfilePath(validatedUid));
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      email: data.email || "",
      contactEmail: data.contactEmail || "",
      displayName: data.displayName || "",
      photoUrl: data.photoUrl || "",
      emailVerified: data.emailVerified || false,
      credits: data.credits || 0,
      selectedAvatar: data.selectedAvatar || "",
      selectedTalkingPhoto: data.selectedTalkingPhoto || "",
      useCredits: data.useCredits !== undefined ? data.useCredits : true,
    };
  } catch (error) {
    logger.error("Error fetching user profile", error);
    throw new StorageError(
      'Failed to fetch user profile',
      'firestore-read',
      error as Error,
      { userId: validatedUid }
    );
  }
};

/**
 * Saves a complete user profile to Firestore
 * 
 * @param uid - The user's unique identifier
 * @param profileData - Complete profile data to save
 * @returns Promise that resolves when save is complete
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * await saveUserProfile(user.uid, {
 *   email: 'user@example.com',
 *   displayName: 'John Doe',
 *   credits: 1000
 * });
 * ```
 */
export const saveUserProfile = async (
  uid: string,
  profileData: ProfileType
): Promise<void> => {
  const validatedUid = validateUserId(uid);
  
  try {
    const userRef = doc(db, getUserProfilePath(validatedUid));
    await setDoc(userRef, profileData);
  } catch (error) {
    logger.error("Error saving user profile", error);
    throw new StorageError(
      'Failed to save user profile',
      'firestore-write',
      error as Error,
      { userId: validatedUid }
    );
  }
};

/**
 * Updates specific fields in a user's profile
 * 
 * @param uid - The user's unique identifier
 * @param data - Partial profile data to update
 * @returns Promise that resolves when update is complete
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * await updateUserProfile(user.uid, { credits: 500 });
 * ```
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<ProfileType>
): Promise<void> => {
  const validatedUid = validateUserId(uid);
  
  try {
    const userRef = doc(db, getUserProfilePath(validatedUid));
    await updateDoc(userRef, data);
  } catch (error) {
    logger.error("Error updating user profile", error);
    throw new StorageError(
      'Failed to update user profile',
      'firestore-write',
      error as Error,
      { userId: validatedUid }
    );
  }
};

/**
 * Deletes a user account from both Firestore and Firebase Authentication
 * 
 * @param uid - The user's unique identifier
 * @returns Promise that resolves when deletion is complete
 * @throws {Error} If no current user is found
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * await deleteUserAccount(user.uid);
 * // User is now deleted from both Firestore and Auth
 * ```
 */
export const deleteUserAccount = async (uid: string): Promise<void> => {
  const validatedUid = validateUserId(uid);
  
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new StorageError(
        'No current user found',
        'auth',
        new Error('Authentication required'),
        { userId: validatedUid }
      );
    }

    const userRef = doc(db, getUserProfilePath(validatedUid));
    
    // Delete the user profile data from Firestore
    await deleteDoc(userRef);

    // Delete the user from Firebase Authentication
    await deleteUser(currentUser);
  } catch (error) {
    logger.error("Error deleting user account", error);
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      'Failed to delete user account',
      'firestore-write',
      error as Error,
      { userId: validatedUid }
    );
  }
};




