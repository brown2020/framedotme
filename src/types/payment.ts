import type { Timestamp } from "firebase/firestore";

/**
 * Payment status types
 * - pending: Payment initiated but not completed
 * - succeeded: Payment successfully completed (Stripe status)
 * - completed: Payment successfully completed (generic status)
 * - failed: Payment failed
 * - refunded: Payment was refunded
 */
export type PaymentStatus = "pending" | "succeeded" | "completed" | "failed" | "refunded";

/**
 * Payment mode types
 * - one-time: Single payment
 * - subscription: Recurring payment
 * - iap: In-app purchase (mobile)
 */
export type PaymentMode = "one-time" | "subscription" | "iap";

/**
 * Payment platform types
 */
export type PaymentPlatform = "stripe" | "apple" | "google";

/**
 * Payment type definition
 */
export interface Payment {
  id: string;
  amount: number;
  createdAt: Timestamp | null;
  status: PaymentStatus;
  mode: PaymentMode;
  platform: PaymentPlatform;
  productId: string;
  currency: string;
}

/**
 * Payment creation input (without server-generated fields)
 */
export type PaymentInput = Omit<Payment, "createdAt">;
