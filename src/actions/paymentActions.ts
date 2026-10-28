"use server";

import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { AppError } from "@/types/errors";
import { creditPackAmountError } from "@/constants/payment";
import { requireAuthenticatedSession } from "@/services/sessionService";
import { fulfillStripePayment, type FulfillmentResult } from "@/services/billingService";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new AppError("STRIPE_SECRET_KEY environment variable is required", "payment");
  }
  return new Stripe(key);
}

export type { FulfillmentResult };

async function requireVerifiedSession() {
  const session = await requireAuthenticatedSession();
  if (!session.emailVerified) {
    throw new AppError("Verify your email before purchasing credits", "payment");
  }
  return session;
}

export async function createPaymentIntent(amount: number): Promise<string | null> {
  const session = await requireVerifiedSession();
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;
  const amountError = creditPackAmountError(amount);
  if (amountError) {
    throw new AppError(amountError, "payment");
  }
  if (!product) throw new AppError("Stripe product name is not defined", "payment");

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        product,
        userId: session.uid,
        credits: "10000",
      },
      description: `Payment for product ${product}`,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    logger.error("Error creating payment intent", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create payment intent", "payment", {
      originalError: error as Error,
    });
  }
}

/**
 * Re-checks a PaymentIntent with Stripe and grants the fixed credit pack once.
 * Safe to call from the success page and from the webhook.
 */
export async function confirmStripePayment(
  paymentIntentId: string,
): Promise<FulfillmentResult> {
  const session = await requireVerifiedSession();

  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
    throw new AppError("Invalid payment intent", "payment");
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata.userId !== session.uid) {
      throw new AppError("Payment intent does not belong to this account", "payment", {
        paymentId: paymentIntentId,
      });
    }
    return await fulfillStripePayment(paymentIntent);
  } catch (error) {
    logger.error("Error confirming payment intent", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to confirm payment intent", "payment", {
      paymentId: paymentIntentId,
      originalError: error as Error,
    });
  }
}

/** @deprecated Use confirmStripePayment. Kept so older clients fail closed. */
export async function validatePaymentIntent(paymentIntentId: string): Promise<FulfillmentResult> {
  return confirmStripePayment(paymentIntentId);
}
