import toast from "react-hot-toast";
import { 
  isStorageError, 
  isAuthenticationError, 
  isPaymentError, 
  isValidationError
} from "@/types/guards";
import { AppError } from "@/types/errors";
import { MediaStreamError } from "@/types/mediaStreamTypes";
import { logger } from "@/utils/logger";

/**
 * Error handling utilities
 * 
 * Pure formatters: Convert errors to user-friendly messages without side effects
 * Side-effect functions: Display errors to users and log them
 */

// ============================================================================
// PURE FORMATTERS (no side effects)
// ============================================================================

/**
 * Extracts a user-friendly error message from an unknown error with context awareness
 * @param error - The error object to extract message from
 * @param defaultMessage - Fallback message if error cannot be parsed
 * @param operation - Optional operation context for better error messages
 * @returns A user-friendly error message string
 */
export const getErrorMessage = (
  error: unknown, 
  defaultMessage = "An unknown error occurred",
  operation?: string
): string => {
  // Handle custom error types with context
  if (isStorageError(error)) {
    return getStorageErrorMessage(error, operation);
  }
  
  if (isAuthenticationError(error)) {
    return getAuthErrorMessage(error);
  }
  
  if (isPaymentError(error)) {
    return getPaymentErrorMessage(error);
  }
  
  if (isValidationError(error)) {
    return `Validation failed${error.metadata.field ? ` for ${error.metadata.field}` : ''}: ${error.message}`;
  }
  
  // Handle MediaStreamError
  if (error instanceof MediaStreamError) {
    return getMediaStreamErrorMessage(error);
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return getContextualErrorMessage(error, operation);
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return defaultMessage;
};

/**
 * Gets a user-friendly message for storage errors
 */
function getStorageErrorMessage(error: AppError, operation?: string): string {
  const op = operation || 'complete the operation';
  const stageMessage = error.metadata.stage ? ` (${error.metadata.stage})` : '';
  return `Failed to ${op}${stageMessage}: ${error.message}`;
}

/**
 * Gets a user-friendly message for authentication errors
 */
function getAuthErrorMessage(error: AppError): string {
  const codeMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  
  if (error.metadata.code) {
    const message = codeMessages[error.metadata.code];
    if (message) return message;
  }
  return error.message;
}

/**
 * Gets a user-friendly message for payment errors
 */
function getPaymentErrorMessage(error: AppError): string {
  if (error.metadata.paymentId) {
    return `Payment failed (ID: ${error.metadata.paymentId}): ${error.message}`;
  }
  return `Payment failed: ${error.message}`;
}

/**
 * Gets a user-friendly message for media stream errors
 */
function getMediaStreamErrorMessage(error: MediaStreamError): string {
  const typeMessages: Record<string, string> = {
    'permission': 'Permission denied. Please allow access to continue.',
    'device': 'Failed to access recording device. Please check your settings.',
    'stream': 'Failed to process media stream. Please try again.',
    'unknown': 'An unexpected error occurred. Please try again.',
  };
  
  return typeMessages[error.type] || error.message;
}

/**
 * Gets context-aware error message for standard errors
 */
function getContextualErrorMessage(error: Error, operation?: string): string {
  const message = error.message.toLowerCase();
  
  // Firebase-specific errors
  if (message.includes('permission-denied')) {
    return `You don't have permission to ${operation || 'perform this action'}. Please check your account settings.`;
  }
  
  if (message.includes('not-found')) {
    return `The requested ${operation || 'resource'} was not found.`;
  }
  
  if (message.includes('network')) {
    return `Network error while trying to ${operation || 'connect'}. Please check your internet connection.`;
  }
  
  if (message.includes('quota')) {
    return `Storage quota exceeded. Please free up some space.`;
  }
  
  if (message.includes('unauthenticated')) {
    return `You must be signed in to ${operation || 'perform this action'}.`;
  }
  
  return error.message;
}

// ============================================================================
// SIDE-EFFECT FUNCTIONS (logging, notifications)
// ============================================================================

/**
 * Logs an error with context
 */
export const logError = (context: string, error: unknown): void => {
  const message = getErrorMessage(error);
  logger.error(`[${context}]`, message, error);
};

/**
 * Displays an error toast notification with context
 */
export const showErrorToast = (error: unknown, defaultMessage?: string, operation?: string): void => {
  const message = getErrorMessage(error, defaultMessage, operation);
  toast.error(message);
};

/**
 * Handles an error by logging it and optionally showing a toast
 */
export const handleError = (
  context: string,
  error: unknown,
  options?: {
    showToast?: boolean;
    defaultMessage?: string;
    operation?: string;
  }
): string => {
  const { showToast = false, defaultMessage, operation } = options || {};
  const message = getErrorMessage(error, defaultMessage, operation);
  
  logger.error(`[${context}]`, message, error);
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
};
