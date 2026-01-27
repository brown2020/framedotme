/**
 * Type guard utilities for runtime type checking
 * Consolidated location for all type guards organized by domain
 */

import type { AppError } from "./errors";

// ============================================================================
// Error Guards
// ============================================================================

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && error.constructor.name === 'AppError';
}

/**
 * Type guard to check if error is a storage error
 */
export function isStorageError(error: unknown): error is AppError {
  return isAppError(error) && (error as AppError).category === 'storage';
}

/**
 * Type guard to check if error is an authentication error
 */
export function isAuthenticationError(error: unknown): error is AppError {
  return isAppError(error) && (error as AppError).category === 'authentication';
}

/**
 * Type guard to check if error is a payment error
 */
export function isPaymentError(error: unknown): error is AppError {
  return isAppError(error) && (error as AppError).category === 'payment';
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(error: unknown): error is AppError {
  return isAppError(error) && (error as AppError).category === 'validation';
}

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
