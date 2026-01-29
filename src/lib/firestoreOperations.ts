/**
 * Firestore operation wrappers for consistent error handling
 *
 * PURPOSE:
 * These wrappers ensure all Firestore operations throw consistent AppError instances
 * with proper categorization and context, making error handling predictable throughout
 * the application.
 *
 * WHEN TO USE:
 * - ALWAYS use these wrappers in the services layer (src/services/)
 * - Use firestoreRead() for all read operations (getDoc, getDocs, onSnapshot, etc.)
 * - Use firestoreWrite() for all write operations (setDoc, updateDoc, deleteDoc, etc.)
 *
 * ERROR HANDLING HIERARCHY:
 * 1. Services (lib/, services/) - Throw AppError for all failures using these wrappers
 * 2. Hooks (hooks/) - Catch errors, show toast notifications, set local error state
 * 3. Components - Display inline error messages from hook state
 *
 * EXAMPLES:
 * ```typescript
 * // Reading from Firestore
 * export async function fetchUserProfile(uid: string): Promise<Profile | null> {
 *   return firestoreRead(
 *     async () => {
 *       const docSnap = await getDoc(doc(db, 'users', uid));
 *       return docSnap.exists() ? docSnap.data() : null;
 *     },
 *     'Failed to fetch user profile',
 *     { userId: uid }
 *   );
 * }
 *
 * // Writing to Firestore
 * export async function saveUserProfile(uid: string, data: Profile): Promise<void> {
 *   await firestoreWrite(
 *     () => setDoc(doc(db, 'users', uid), data),
 *     'Failed to save user profile',
 *     { userId: uid }
 *   );
 * }
 * ```
 */

import { AppError } from "@/types/errors";

/**
 * Generic Firestore read operation wrapper
 * Specifically for read operations with appropriate stage
 *
 * @param operation - The Firestore read operation to execute
 * @param errorMessage - User-friendly error message
 * @param context - Additional context for error reporting
 * @returns The operation result
 * @throws {AppError} With storage category and firestore-read stage
 */
export async function firestoreRead<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(errorMessage, "storage", {
      stage: "firestore-read",
      originalError: error as Error,
      context,
    });
  }
}

/**
 * Generic Firestore write operation wrapper
 * Specifically for write operations with appropriate stage
 *
 * @param operation - The Firestore write operation to execute
 * @param errorMessage - User-friendly error message
 * @param context - Additional context for error reporting
 * @returns The operation result
 * @throws {AppError} With storage category and firestore-write stage
 */
export async function firestoreWrite<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(errorMessage, "storage", {
      stage: "firestore-write",
      originalError: error as Error,
      context,
    });
  }
}
