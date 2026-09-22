"use server";

import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { AppError } from "@/types/errors";
import { MINIMUM_PAYMENT_AMOUNT_CENTS } from "@/constants/payment";
import { requireAuthenticatedSession } from "@/services/sessionService";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new AppError("STRIPE_SECRET_KEY environment variable is required", "payment");
  }
  // Fresh client per call — avoids mutable module-level state on the server.
  return new Stripe(key);
}

interface PaymentIntentResult {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency: string;
  description: string | null;
}

export async function createPaymentIntent(amount: number): Promise<string | null> {
  const session = await requireAuthenticatedSession();
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new AppError("Amount must be a positive integer (in cents)", "payment");
  }

  if (amount < MINIMUM_PAYMENT_AMOUNT_CENTS) {
    throw new AppError(
      `Amount must be at least ${MINIMUM_PAYMENT_AMOUNT_CENTS} cents`,
      "payment",
    );
  }

  try {
    if (!product) throw new AppError("Stripe product name is not defined", "payment");

    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { product, userId: session.uid },
      description: `Payment for product ${process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME}`,
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

export async function validatePaymentIntent(
  paymentIntentId: string,
): Promise<PaymentIntentResult> {
  const session = await requireAuthenticatedSession();

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

    if (paymentIntent.status === "succeeded") {
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
        status: paymentIntent.status,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
      };
    }
    throw new AppError("Payment was not successful", "payment", {
      paymentId: paymentIntentId,
    });
  } catch (error) {
    logger.error("Error validating payment intent", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to validate payment intent", "payment", {
      paymentId: paymentIntentId,
      originalError: error as Error,
    });
  }
}
