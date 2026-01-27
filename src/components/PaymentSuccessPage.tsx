"use client";

import { validatePaymentIntent } from "@/actions/paymentActions";
import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import useProfileStore from "@/zustand/useProfileStore";
import { BONUS_CREDITS } from "@/lib/constants";
import Link from "next/link";
import { useEffect, useReducer } from "react";
import { logger } from "@/utils/logger";

type Props = {
  payment_intent: string;
};

type PaymentState = {
  loading: boolean;
  message: string;
  paymentData: {
    id: string;
    created: number;
    amount: number;
    status: string;
  } | null;
};

type PaymentAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_SUCCESS"; message: string; data: { id: string; created: number; amount: number; status: string } };

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, loading: false, message: action.message, paymentData: null };
    case "SET_SUCCESS":
      return { ...state, loading: false, message: action.message, paymentData: action.data };
    default:
      return state;
  }
}

const initialState: PaymentState = {
  loading: true,
  message: "",
  paymentData: null,
};

export default function PaymentSuccessPage({ payment_intent }: Props) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  const addPayment = usePaymentsStore((state) => state.addPayment);
  const checkIfPaymentProcessed = usePaymentsStore(
    (state) => state.checkIfPaymentProcessed
  );
  const addCredits = useProfileStore((state) => state.addCredits);
  const uid = useAuthStore((state) => state.uid);

  useEffect(() => {
    if (!payment_intent) {
      dispatch({ type: "SET_ERROR", message: "No payment intent found" });
      return;
    }

    const handlePaymentSuccess = async () => {
      if (!uid) return;
      
      try {
        const data = await validatePaymentIntent(payment_intent);

        if (data.status === "succeeded") {
          // Check if payment is already processed
          const existingPayment = await checkIfPaymentProcessed(uid, data.id);
          
          if (existingPayment) {
            dispatch({
              type: "SET_SUCCESS",
              message: "Payment has already been processed.",
              data: {
                id: existingPayment.id,
                created: existingPayment.createdAt?.toMillis() || 0,
                amount: existingPayment.amount,
                status: existingPayment.status,
              },
            });
            return;
          }

          // Add payment to store
          await addPayment(uid, {
            id: data.id,
            amount: data.amount,
            status: data.status,
            mode: "one-time",
            platform: "stripe",
            productId: "payment_gateway",
            currency: "usd",
          });

          // Add credits to profile
          const creditsToAdd = data.amount + BONUS_CREDITS;
          await addCredits(uid, creditsToAdd);

          dispatch({
            type: "SET_SUCCESS",
            message: "Payment successful",
            data: {
              id: data.id,
              created: data.created * 1000,
              amount: data.amount,
              status: data.status,
            },
          });
        } else {
          logger.error(`Payment validation failed: ${data.status}`);
          dispatch({ type: "SET_ERROR", message: "Payment validation failed" });
        }
      } catch (error) {
        logger.error("Error handling payment success", error);
        dispatch({ type: "SET_ERROR", message: "Error handling payment success" });
      }
    };

    if (uid) handlePaymentSuccess();
  }, [payment_intent, addPayment, checkIfPaymentProcessed, addCredits, uid]);

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-md border-black">
      {state.loading ? (
        <div>validating...</div>
      ) : state.paymentData ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-md my-5 text-4xl font-bold mx-auto">
            ${state.paymentData.amount / 100}
          </div>
          <div>Uid: {uid}</div>
          <div>Id: {state.paymentData.id}</div>
          <div>Created: {new Date(state.paymentData.created).toLocaleString()}</div>
          <div>Status: {state.paymentData.status}</div>
        </div>
      ) : (
        <div>{state.message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-50"
      >
        View Account
      </Link>
    </main>
  );
}
