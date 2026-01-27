"use client";

import PaymentCheckoutPage from "@/components/PaymentCheckoutPage";
import convertToSubcurrency from "@/utils/convertToSubcurrency";
import { DEFAULT_PAYMENT_AMOUNT, DEFAULT_PAYMENT_CURRENCY } from "@/lib/constants";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

if (process.env.NEXT_PUBLIC_STRIPE_KEY === undefined) {
  throw new Error("NEXT_PUBLIC_STRIPE_KEY is not defined");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

export default function PaymentAttempt() {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: convertToSubcurrency(DEFAULT_PAYMENT_AMOUNT),
        currency: DEFAULT_PAYMENT_CURRENCY,
      }}
    >
      <PaymentCheckoutPage amount={DEFAULT_PAYMENT_AMOUNT} />
    </Elements>
  );
}
