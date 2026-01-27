/**
 * Custom error types for better error handling and debugging
 */

/**
 * Error categories for application errors
 */
export type ErrorCategory = 'storage' | 'authentication' | 'payment' | 'validation';

/**
 * Metadata for specific error types
 */
export interface ErrorMetadata {
  // Storage errors
  stage?: 'storage-upload' | 'firestore-write' | 'firestore-read' | 'upload-init' | 'storage-delete' | 'auth';
  
  // Authentication errors
  code?: string;
  
  // Payment errors
  paymentId?: string;
  
  // Validation errors
  field?: string;
  value?: unknown;
  
  // Common metadata
  originalError?: Error;
  context?: Record<string, unknown>;
}

/**
 * Unified application error class
 * Replaces StorageError, AuthenticationError, PaymentError, and ValidationError
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly metadata: ErrorMetadata = {}
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Legacy aliases for backwards compatibility
export const StorageError = AppError;
export const AuthenticationError = AppError;
export const PaymentError = AppError;
export const ValidationError = AppError;
