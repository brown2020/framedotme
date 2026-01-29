import type { Profile } from "@/types/profile";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";

import { AppError } from "@/types/errors";
import { db, auth } from "@/firebase/firebaseClient";
import { getUserPath, getUserProfilePath } from "@/lib/firestore";
import { firestoreRead, firestoreWrite } from "@/lib/firestoreOperations";
import { validateUserId } from "@/lib/validation";

/**
 * Updates user authentication details in Firestore
 * Automatically sanitizes to remove function properties and adds lastSignIn timestamp
 *
 * @param details - Object containing user details to update
 * @param uid - The user's unique identifier
 * @throws {ValidationError} If uid is invalid
 */
export async function updateUserDetailsInFirestore(
  details: Record<string, unknown>,
  uid: string,
): Promise<void> {
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

  await firestoreWrite(
    () =>
      setDoc(
        userRef,
        { ...sanitizedDetails, lastSignIn: serverTimestamp() },
        { merge: true },
      ),
    "Failed to update user details",
    { userId: validatedUid },
  );
}

/**
 * Fetches a user's profile from Firestore
 *
 * @param uid - The user's unique identifier
 * @returns Promise resolving to the user's profile or null if not found
 * @throws {ValidationError} If uid is invalid
 */
export async function fetchUserProfile(uid: string): Promise<Profile | null> {
  const validatedUid = validateUserId(uid);

  return firestoreRead(
    async () => {
      // Ensure Firebase auth is initialized before querying
      // This ensures request.auth is available in Firestore security rules
      if (!auth.currentUser) {
        throw new Error(
          "Firebase auth not initialized - user not authenticated",
        );
      }

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
    },
    "Failed to fetch user profile",
    { userId: validatedUid },
  );
}

/**
 * Saves a complete user profile to Firestore
 *
 * @param uid - The user's unique identifier
 * @param profileData - Complete profile data to save
 * @throws {ValidationError} If uid is invalid
 */
export async function saveUserProfile(
  uid: string,
  profileData: Profile,
): Promise<void> {
  const validatedUid = validateUserId(uid);

  await firestoreWrite(
    () => {
      const userRef = doc(db, getUserProfilePath(validatedUid));
      return setDoc(userRef, profileData);
    },
    "Failed to save user profile",
    { userId: validatedUid },
  );
}

/**
 * Updates specific fields in a user's profile
 *
 * @param uid - The user's unique identifier
 * @param data - Partial profile data to update
 * @throws {ValidationError} If uid is invalid
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Profile>,
): Promise<void> {
  const validatedUid = validateUserId(uid);

  await firestoreWrite(
    () => {
      const userRef = doc(db, getUserProfilePath(validatedUid));
      return updateDoc(userRef, data);
    },
    "Failed to update user profile",
    { userId: validatedUid },
  );
}

/**
 * Deletes a user account from both Firestore and Firebase Authentication
 *
 * @param uid - The user's unique identifier
 * @throws {Error} If no current user is found
 * @throws {ValidationError} If uid is invalid
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  const validatedUid = validateUserId(uid);

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new AppError("No current user found", "storage", {
        stage: "auth",
        originalError: new Error("Authentication required"),
        context: { userId: validatedUid },
      });
    }

    const userRef = doc(db, getUserProfilePath(validatedUid));

    // Delete the user profile data from Firestore
    await deleteDoc(userRef);

    // Delete the user from Firebase Authentication
    await deleteUser(currentUser);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to delete user account", "storage", {
      stage: "firestore-write",
      originalError: error as Error,
      context: { userId: validatedUid },
    });
  }
}
