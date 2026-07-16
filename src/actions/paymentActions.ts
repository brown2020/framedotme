"use server";

import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { AppError } from "@/types/errors";
import { MINIMUM_PAYMENT_AMOUNT_CENTS } from "@/constants/payment";
import { requireAuthenticatedSession } from "@/services/sessionService";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

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

  // Validate amount parameter
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new AppError("Amount must be a positive integer (in cents)", 'payment');
  }

  if (amount < MINIMUM_PAYMENT_AMOUNT_CENTS) {
    throw new AppError(`Amount must be at least ${MINIMUM_PAYMENT_AMOUNT_CENTS} cents`, 'payment');
  }

  try {
    if (!product) throw new AppError("Stripe product name is not defined", 'payment');

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { product, userId: session.uid },
      description: `Payment for product ${process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME}`,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    logger.error("Error creating payment intent", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create payment intent", 'payment', { originalError: error as Error });
  }
}

export async function validatePaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult> {
  const session = await requireAuthenticatedSession();

  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
    throw new AppError("Invalid payment intent", "payment");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== session.uid) {
      throw new AppError("Payment intent does not belong to this account", "payment", {
        paymentId: paymentIntentId,
      });
    }

    if (paymentIntent.status === "succeeded") {
      // Convert the Stripe object to a plain object
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
        status: paymentIntent.status,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
      };
    } else {
      throw new AppError("Payment was not successful", 'payment', { paymentId: paymentIntentId });
    }
  } catch (error) {
    logger.error("Error validating payment intent", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to validate payment intent", 'payment', { 
      paymentId: paymentIntentId, 
      originalError: error as Error 
    });
  }
}
