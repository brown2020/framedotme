/**
 * Custom error types for better error handling and debugging
 */

/**
 * Error categories for application errors
 */
export type ErrorCategory = 'storage' | 'authentication' | 'payment' | 'validation';

/**
 * Error stages for tracking where errors occur in operations
 */
export type ErrorStage = 
  | 'storage-upload'
  | 'firestore-write'
  | 'firestore-read'
  | 'upload-init'
  | 'storage-delete'
  | 'auth';

/**
 * Metadata for specific error types
 */
export interface ErrorMetadata {
  // Operation stage where error occurred
  stage?: ErrorStage;
  
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
