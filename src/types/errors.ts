import type { ErrorCategory, ErrorMetadata, ErrorStage } from "./error-metadata";

/**
 * Unified application error class
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

// Re-export types for convenience
export type { ErrorCategory, ErrorMetadata, ErrorStage } from "./error-metadata";
