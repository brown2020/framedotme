import "server-only";

import type Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/firebaseAdmin";
import {
  CREDIT_PACK_AMOUNT_CENTS,
  CREDIT_PACK_CREDITS,
  DEFAULT_PAYMENT_CURRENCY,
} from "@/constants/payment";
import { AppError } from "@/types/errors";
import { logger } from "@/utils/logger";

export interface FulfillmentResult {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency: string;
  creditsAdded: number;
  alreadyProcessed: boolean;
}

function paymentRef(uid: string, paymentIntentId: string) {
  return adminDb.doc(`users/${uid}/payments/${paymentIntentId}`);
}

function profileRef(uid: string) {
  return adminDb.doc(`users/${uid}/profile/userData`);
}

/**
 * Records a succeeded catalog PaymentIntent and grants the fixed credit pack.
 * Idempotent on the PaymentIntent id. Callers must already have authenticated
 * the buyer (session or verified Stripe webhook).
 */
export async function fulfillStripePayment(
  paymentIntent: Stripe.PaymentIntent,
): Promise<FulfillmentResult> {
  const uid = paymentIntent.metadata.userId ?? "";
  if (!uid) {
    throw new AppError("Payment is missing an account", "payment", {
      paymentId: paymentIntent.id,
    });
  }
  if (paymentIntent.status !== "succeeded") {
    throw new AppError("Payment was not successful", "payment", {
      paymentId: paymentIntent.id,
    });
  }
  if (
    paymentIntent.amount !== CREDIT_PACK_AMOUNT_CENTS ||
    paymentIntent.currency !== DEFAULT_PAYMENT_CURRENCY
  ) {
    throw new AppError("Payment does not match the credit pack price", "payment", {
      paymentId: paymentIntent.id,
    });
  }

  const ref = paymentRef(uid, paymentIntent.id);
  const creditsAdded = await adminDb.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return 0;

    transaction.set(ref, {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      createdAt: FieldValue.serverTimestamp(),
      status: "succeeded",
      mode: "one-time",
      currency: paymentIntent.currency,
      platform: "stripe",
      productId: "credits_10000",
    });
    transaction.set(
      profileRef(uid),
      { credits: FieldValue.increment(CREDIT_PACK_CREDITS) },
      { merge: true },
    );
    return CREDIT_PACK_CREDITS;
  });

  if (creditsAdded > 0) {
    logger.info("Granted credit pack", { uid, paymentId: paymentIntent.id });
  }

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    created: paymentIntent.created,
    status: paymentIntent.status,
    currency: paymentIntent.currency,
    creditsAdded,
    alreadyProcessed: creditsAdded === 0,
  };
}
