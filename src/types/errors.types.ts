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
