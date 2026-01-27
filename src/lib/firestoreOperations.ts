import { AppError } from "@/types/errors";

/**
 * Generic Firestore operation wrapper with consistent error handling
 * Reduces boilerplate try-catch patterns across service files
 * 
 * @param operation - The Firestore operation to execute
 * @param errorMessage - User-friendly error message
 * @param context - Additional context for error reporting
 * @returns The operation result
 * @throws {AppError} With storage category and firestore-write/read stage
 * 
 * @example
 * ```typescript
 * const result = await firestoreOperation(
 *   () => getDoc(docRef),
 *   'Failed to fetch user profile',
 *   { userId: uid }
 * );
 * ```
 */
export async function firestoreOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(
      errorMessage,
      'storage',
      { 
        stage: 'firestore-write',
        originalError: error as Error,
        context
      }
    );
  }
}

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
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(
      errorMessage,
      'storage',
      { 
        stage: 'firestore-read',
        originalError: error as Error,
        context
      }
    );
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
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(
      errorMessage,
      'storage',
      { 
        stage: 'firestore-write',
        originalError: error as Error,
        context
      }
    );
  }
}
