import toast from "react-hot-toast";
import { 
  isStorageError, 
  isAuthenticationError, 
  isPaymentError, 
  isValidationError,
  StorageError,
  AuthenticationError,
  PaymentError
} from "@/types/errors";

/**
 * Extracts a user-friendly error message from an unknown error with context awareness
 * @param error - The error object to extract message from
 * @param defaultMessage - Fallback message if error cannot be parsed
 * @param operation - Optional operation context for better error messages
 * @returns A user-friendly error message string
 */
export function getErrorMessage(
  error: unknown, 
  defaultMessage = "An unknown error occurred",
  operation?: string
): string {
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
    return `Validation failed${error.field ? ` for ${error.field}` : ''}: ${error.message}`;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return getContextualErrorMessage(error, operation);
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return defaultMessage;
}

/**
 * Gets a user-friendly message for storage errors
 */
function getStorageErrorMessage(error: StorageError, operation?: string): string {
  const op = operation || 'complete the operation';
  const stageMessage = error.stage ? ` (${error.stage})` : '';
  return `Failed to ${op}${stageMessage}: ${error.message}`;
}

/**
 * Gets a user-friendly message for authentication errors
 */
function getAuthErrorMessage(error: AuthenticationError): string {
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
  
  if (error.code) {
    const message = codeMessages[error.code];
    if (message) return message;
  }
  return error.message;
}

/**
 * Gets a user-friendly message for payment errors
 */
function getPaymentErrorMessage(error: PaymentError): string {
  if (error.paymentId) {
    return `Payment failed (ID: ${error.paymentId}): ${error.message}`;
  }
  return `Payment failed: ${error.message}`;
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

/**
 * Displays an error toast notification with context
 */
export function showErrorToast(error: unknown, defaultMessage?: string, operation?: string): void {
  const message = getErrorMessage(error, defaultMessage, operation);
  toast.error(message);
}

/**
 * Logs an error to the console with context
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[${context}]`, message, error);
}

/**
 * Handles an error by logging it and optionally showing a toast
 */
export function handleError(
  context: string,
  error: unknown,
  options?: {
    showToast?: boolean;
    defaultMessage?: string;
    operation?: string;
  }
): string {
  const { showToast = false, defaultMessage, operation } = options || {};
  const message = getErrorMessage(error, defaultMessage, operation);
  
  logError(context, error);
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
}
