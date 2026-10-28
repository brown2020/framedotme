"use client";

import { confirmStripePayment } from "@/actions/paymentActions";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import Link from "next/link";
import { useEffect, useReducer } from "react";
import { logger } from "@/utils/logger";
import { LocalDateTime } from "@/components/ui/local-date-time";

interface Props {
  payment_intent: string;
}

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
  | {
      type: "SET_SUCCESS";
      message: string;
      data: { id: string; created: number; amount: number; status: string };
    };

const paymentReducer = (
  state: PaymentState,
  action: PaymentAction,
): PaymentState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return {
        ...state,
        loading: false,
        message: action.message,
        paymentData: null,
      };
    case "SET_SUCCESS":
      return {
        ...state,
        loading: false,
        message: action.message,
        paymentData: action.data,
      };
    default:
      return state;
  }
};

const initialState: PaymentState = {
  loading: true,
  message: "",
  paymentData: null,
};

export function PaymentSuccess({ payment_intent }: Props) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  const applyCreditsLocally = useProfileStore(
    (profileState) => profileState.applyCreditsLocally,
  );
  const uid = useAuthStore((authState) => authState.uid);

  useEffect(() => {
    if (!payment_intent) {
      dispatch({ type: "SET_ERROR", message: "No payment intent found" });
      return;
    }

    if (!uid) return;

    let cancelled = false;

    confirmStripePayment(payment_intent)
      .then((data) => {
        if (cancelled) return;

        if (data.creditsAdded > 0) {
          applyCreditsLocally(data.creditsAdded);
        }

        dispatch({
          type: "SET_SUCCESS",
          message: data.alreadyProcessed
            ? "Payment has already been processed."
            : "Payment successful",
          data: {
            id: data.id,
            created: data.created * 1000,
            amount: data.amount,
            status: data.status,
          },
        });
      })
      .catch((error) => {
        if (cancelled) return;
        logger.error("Error handling payment success", error);
        dispatch({
          type: "SET_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error handling payment success",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [payment_intent, applyCreditsLocally, uid]);

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
          <div>
            Created: <LocalDateTime value={state.paymentData.created} />
          </div>
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
