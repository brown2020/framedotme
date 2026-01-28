import { z, type ZodSchema } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Validation schemas for runtime type checking
 */

/** Generic validation helper that parses with Zod and provides consistent error messages */
const validate = <T>(schema: ZodSchema<T>, value: unknown, fieldName: string): T => {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(`Failed to validate ${fieldName}: ${error instanceof Error ? error.message : 'Invalid value'}`);
  }
};

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
export function validateUserId(uid: unknown): string {
  const sanitized = typeof uid === 'string' ? uid.trim() : uid;
  return validate(UserIdSchema, sanitized, 'user ID');
}

/**
 * Sanitizes a filename by removing dangerous characters
 * Trims whitespace and removes path traversal attempts
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .trim()
    .replace(/\.\./g, '') // Remove .. path traversal
    .replace(/[/\\]/g, ''); // Remove path separators
};

/**
 * Validates that filename has an allowed extension
 * @throws {Error} If extension is not in ALLOWED_EXTENSIONS list
 */
const validateExtension = (filename: string): void => {
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  if (!hasAllowedExtension) {
    throw new Error(
      `Failed to validate filename: only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`
    );
  }
};

/**
 * Checks for null bytes and control characters in filename
 * @throws {Error} If filename contains invalid control characters
 */
const checkControlCharacters = (filename: string): void => {
  if (/[\x00-\x1f\x7f]/.test(filename)) {
    throw new Error('Failed to validate filename: contains invalid control characters');
  }
};

/**
 * Validates and sanitizes a filename
 * Performs type checking, sanitization, extension validation, and control character checks
 * @throws {ValidationError} If the filename is invalid or unsafe
 */
export function validateFilename(filename: unknown): string {
  if (typeof filename !== 'string') {
    return validate(FileNameSchema, filename, 'filename');
  }
  
  const sanitized = sanitizeFilename(filename);
  const validated = validate(FileNameSchema, sanitized, 'filename');
  
  validateExtension(validated);
  checkControlCharacters(validated);
  
  return validated;
};
