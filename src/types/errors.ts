/**
 * Custom error types for better error handling and debugging
 */

/**
 * Error thrown during storage operations (upload, download, delete)
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly stage: 'storage-upload' | 'firestore-write' | 'firestore-read' | 'upload-init' | 'storage-delete' | 'auth',
    public readonly originalError?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Error thrown during authentication operations
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown during payment processing
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly paymentId?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'PaymentError';
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

/**
 * Error thrown during validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Type guard to check if error is a StorageError
 */
export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

/**
 * Type guard to check if error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Type guard to check if error is a PaymentError
 */
export function isPaymentError(error: unknown): error is PaymentError {
  return error instanceof PaymentError;
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
