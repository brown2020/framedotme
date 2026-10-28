import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillStripePayment } from "@/services/billingService";
import { AppError } from "@/types/errors";
import { logger } from "@/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * Stripe webhook. When STRIPE_WEBHOOK_SECRET is unset, no credits are granted
 * and the route returns 503 so the rest of the app keeps running.
 * Buyers who return to /payment-success are fulfilled by confirmStripePayment.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    logger.warn("Stripe webhook signature rejected", error);
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    try {
      await fulfillStripePayment(paymentIntent);
    } catch (error) {
      if (error instanceof AppError) {
        logger.warn("Stripe webhook did not grant credits", error);
        return NextResponse.json({ received: true });
      }
      logger.error("Stripe webhook fulfillment failed", error);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
