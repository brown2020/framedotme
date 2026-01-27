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
 * File name validation schema
 */
export const FileNameSchema = z.string().min(1, 'Filename is required');

/**
 * Video metadata validation schema
 */
export const VideoMetadataSchema = z.object({
  id: z.string().min(1),
  downloadUrl: z.string().url(),
  filename: z.string().min(1),
  createdAt: z.instanceof(Timestamp),
  showOnProfile: z.boolean().optional(),
  botId: z.string().optional(),
  botName: z.string().optional(),
  modelId: z.string().optional(),
  modelName: z.string().optional(),
  language: z.string().optional(),
  languageCode: z.string().optional(),
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
 * Validates and returns a user ID
 * @throws {ValidationError} If the user ID is invalid
 */
export const validateUserId = (uid: unknown): string => {
  return UserIdSchema.parse(uid);
};

/**
 * Validates and returns a filename
 * @throws {ValidationError} If the filename is invalid
 */
export const validateFilename = (filename: unknown): string => {
  return FileNameSchema.parse(filename);
};
