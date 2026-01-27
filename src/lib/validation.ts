import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Validation schemas for runtime type checking
 */

/**
 * User ID validation schema
 */
export const UserIdSchema = z.string().min(1, 'User ID is required');

/**
 * Allowed file extensions for uploads
 */
const ALLOWED_EXTENSIONS = ['.webm'] as const;

/**
 * File name validation schema
 */
export const FileNameSchema = z.string().min(1, 'Filename is required');

/**
 * Video metadata validation schema
 */
export const VideoMetadataSchema = z.object({
  id: z.string().min(1),
  downloadUrl: z.string().url(),
  storagePath: z.string().min(1),
  filename: z.string().min(1),
  createdAt: z.instanceof(Timestamp),
  showOnProfile: z.boolean().optional(),
});

/**
 * Payment validation schema
 */
export const PaymentSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive(),
  createdAt: z.instanceof(Timestamp).nullable(),
  status: z.enum(["pending", "succeeded", "completed", "failed", "refunded"]),
  mode: z.enum(["one-time", "subscription", "iap"]),
  currency: z.string().length(3),
  platform: z.enum(["stripe", "apple", "google"]),
  productId: z.string().min(1),
});

/**
 * Validates and sanitizes a user ID
 * Trims whitespace and validates format
 * @throws {ValidationError} If the user ID is invalid
 */
export const validateUserId = (uid: unknown): string => {
  const sanitized = typeof uid === 'string' ? uid.trim() : uid;
  return UserIdSchema.parse(sanitized);
};

/**
 * Validates and sanitizes a filename
 * Trims whitespace, removes path traversal attempts, validates extension, and ensures safe format
 * @throws {ValidationError} If the filename is invalid or has unsafe extension
 */
export const validateFilename = (filename: unknown): string => {
  if (typeof filename !== 'string') {
    return FileNameSchema.parse(filename);
  }
  
  // Sanitize: trim and remove path traversal attempts
  const sanitized = filename
    .trim()
    .replace(/\.\./g, '') // Remove .. path traversal
    .replace(/[/\\]/g, ''); // Remove path separators
  
  // Validate minimum requirements
  const validated = FileNameSchema.parse(sanitized);
  
  // Check for allowed file extensions
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => 
    validated.toLowerCase().endsWith(ext)
  );
  
  if (!hasAllowedExtension) {
    throw new Error(
      `Failed to validate filename: only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`
    );
  }
  
  // Prevent null bytes and control characters
  if (/[\x00-\x1f\x7f]/.test(validated)) {
    throw new Error('Failed to validate filename: contains invalid control characters');
  }
  
  return validated;
};
