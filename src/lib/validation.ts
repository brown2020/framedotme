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
  status: z.string().min(1),
  mode: z.string().min(1),
  currency: z.string().length(3),
  platform: z.string().min(1),
  productId: z.string().min(1),
});

/**
 * Validates and returns a user ID
 * @throws {ValidationError} If the user ID is invalid
 */
export function validateUserId(uid: unknown): string {
  return UserIdSchema.parse(uid);
}

/**
 * Validates and returns a filename
 * @throws {ValidationError} If the filename is invalid
 */
export function validateFilename(filename: unknown): string {
  return FileNameSchema.parse(filename);
}

/**
 * Type guard to check if a value is a valid VideoMetadata object
 */
export function isVideoMetadata(value: unknown): value is z.infer<typeof VideoMetadataSchema> {
  return VideoMetadataSchema.safeParse(value).success;
}

/**
 * Type guard to check if a value is a valid Payment object
 */
export function isPayment(value: unknown): value is z.infer<typeof PaymentSchema> {
  return PaymentSchema.safeParse(value).success;
}
