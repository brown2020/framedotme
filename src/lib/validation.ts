import { z, type ZodSchema } from "zod";
import { Timestamp } from "firebase/firestore";

/**
 * Validation schemas for runtime type checking
 */

/** Generic validation helper that parses with Zod and provides consistent error messages */
const validate = <T>(
  schema: ZodSchema<T>,
  value: unknown,
  fieldName: string,
): T => {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(
      `Failed to validate ${fieldName}: ${error instanceof Error ? error.message : "Invalid value"}`,
    );
  }
};

/**
 * User ID validation schema
 */
export const UserIdSchema = z.string().min(1, "User ID is required");

/**
 * Allowed file extensions for uploads
 */
const ALLOWED_EXTENSIONS = [".webm"] as const;

/**
 * File name validation schema
 */
export const FileNameSchema = z.string().min(1, "Filename is required");

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
 * Uses .catch() for backward compatibility with existing invalid data
 */
export const PaymentSchema = z.object({
  id: z.string().min(1).catch("unknown"),
  amount: z.number().positive().catch(0),
  createdAt: z.instanceof(Timestamp).nullable(),
  status: z
    .enum(["pending", "succeeded", "completed", "failed", "refunded"])
    .catch("pending"),
  mode: z.enum(["one-time", "subscription", "iap"]).catch("one-time"),
  currency: z.string().length(3).catch("USD"),
  platform: z.enum(["stripe", "apple", "google"]).catch("stripe"),
  productId: z.string().min(1).catch("unknown"),
});

/**
 * Validates and sanitizes a user ID
 * Trims whitespace and validates format
 * @throws {ValidationError} If the user ID is invalid
 */
export function validateUserId(uid: unknown): string {
  const sanitized = typeof uid === "string" ? uid.trim() : uid;
  return validate(UserIdSchema, sanitized, "user ID");
}

/**
 * Validates and sanitizes a filename
 * Performs type checking, sanitization, extension validation, and control character checks
 * @throws {ValidationError} If the filename is invalid or unsafe
 */
export function validateFilename(filename: unknown): string {
  // Type check
  if (typeof filename !== "string") {
    return validate(FileNameSchema, filename, "filename");
  }

  // Sanitize: remove dangerous characters and path traversal attempts
  const sanitized = filename
    .trim()
    .replace(/\.\./g, "") // Remove .. path traversal
    .replace(/[/\\]/g, ""); // Remove path separators

  // Validate length
  const validated = validate(FileNameSchema, sanitized, "filename");

  // Check extension
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
    validated.toLowerCase().endsWith(ext),
  );
  if (!hasAllowedExtension) {
    throw new Error(
      `Failed to validate filename: only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed`,
    );
  }

  // Check for control characters
  if (/[\x00-\x1f\x7f]/.test(validated)) {
    throw new Error(
      "Failed to validate filename: contains invalid control characters",
    );
  }

  return validated;
}
