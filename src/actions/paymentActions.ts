"use server";

import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { PaymentError } from "@/types/errors";
import { MINIMUM_PAYMENT_AMOUNT_CENTS } from "@/constants/payment";

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
  client_secret: string | null;
  currency: string;
  description: string | null;
}

export async function createPaymentIntent(amount: number): Promise<string | null> {
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;

  // Validate amount parameter
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new PaymentError("Amount must be a positive integer (in cents)");
  }

  if (amount < MINIMUM_PAYMENT_AMOUNT_CENTS) {
    throw new PaymentError(`Amount must be at least ${MINIMUM_PAYMENT_AMOUNT_CENTS} cents`);
  }

  try {
    if (!product) throw new PaymentError("Stripe product name is not defined");

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { product },
      description: `Payment for product ${process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME}`,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    logger.error("Error creating payment intent", error);
    if (error instanceof PaymentError) throw error;
    throw new PaymentError("Failed to create payment intent", undefined, error as Error);
  }
}

export async function validatePaymentIntent(paymentIntentId: string): Promise<PaymentIntentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Convert the Stripe object to a plain object
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
      };
    } else {
      throw new PaymentError("Payment was not successful", paymentIntentId);
    }
  } catch (error) {
    logger.error("Error validating payment intent", error);
    if (error instanceof PaymentError) throw error;
    throw new PaymentError("Failed to validate payment intent", paymentIntentId, error as Error);
  }
}
