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
import { ProfileType } from "@/zustand/useProfileStore";

// Auth/User related operations
export const updateUserDetailsInFirestore = async (
  details: Record<string, any>,
  uid: string
) => {
  if (!uid) return;

  const userRef = doc(db, `users/${uid}`);

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
    console.error("Error updating auth details in Firestore:", error);
    throw error;
  }
};

// Profile related operations
export const fetchUserProfile = async (uid: string) => {
  const userRef = doc(db, `users/${uid}/profile/userData`);
  const docSnap = await getDoc(userRef);
  return docSnap.exists() ? (docSnap.data() as ProfileType) : null;
};

export const saveUserProfile = async (
  uid: string,
  profileData: ProfileType
) => {
  const userRef = doc(db, `users/${uid}/profile/userData`);
  await setDoc(userRef, profileData);
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<ProfileType>
) => {
  const userRef = doc(db, `users/${uid}/profile/userData`);
  await updateDoc(userRef, data);
};

export const deleteUserAccount = async (uid: string) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) throw new Error("No current user found");

  const userRef = doc(db, `users/${uid}/profile/userData`);
  
  // Delete the user profile data from Firestore
  await deleteDoc(userRef);

  // Delete the user from Firebase Authentication
  await deleteUser(currentUser);
};



