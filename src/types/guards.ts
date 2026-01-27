/**
 * Type guard utilities for runtime type checking
 */

/**
 * Type guard to check if an error is a Firebase error
 * Firebase errors have code and message properties
 * 
 * @param error - The error to check
 * @returns True if the error is a Firebase error
 */
export function isFirebaseError(
  error: unknown
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
