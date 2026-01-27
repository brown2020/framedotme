import { create } from "zustand";
import { getErrorMessage, logError } from "@/utils/errorHandling";
import { logger } from "@/utils/logger";
import {
  fetchUserPayments,
  checkPaymentExists,
  createPayment,
  findProcessedPayment,
  sortPayments,
} from "@/services/paymentsService";
import type { Payment, PaymentInput } from "@/types/payment";

interface PaymentsStoreState {
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  fetchPayments: (uid: string) => Promise<void>;
  addPayment: (uid: string, payment: PaymentInput) => Promise<void>;
  checkIfPaymentProcessed: (uid: string, paymentId: string) => Promise<Payment | null>;
}

export const usePaymentsStore = create<PaymentsStoreState>((set) => ({
  payments: [],
  paymentsLoading: false,
  paymentsError: null,

  fetchPayments: async (uid: string) => {
    if (!uid) {
      logger.error("Invalid UID for fetchPayments");
      return;
    }

    set({ paymentsLoading: true, paymentsError: null });

    try {
      const payments = await fetchUserPayments(uid);
      set({ payments, paymentsLoading: false, paymentsError: null });
    } catch (error) {
      handleError(set, error, "fetch payments");
    }
  },

  addPayment: async (uid: string, payment: PaymentInput) => {
    if (!uid) {
      logger.error("Invalid UID for addPayment");
      return;
    }

    set({ paymentsLoading: true, paymentsError: null });

    try {
      const paymentExists = await checkPaymentExists(uid, payment.id);
      if (paymentExists) {
        set({ paymentsLoading: false, paymentsError: "Payment with this ID already exists." });
        return;
      }

      const newPayment = await createPayment(uid, payment);
      set((state) => {
        const updatedPayments = sortPayments([...state.payments, newPayment]);
        return { payments: updatedPayments, paymentsLoading: false, paymentsError: null };
      });
    } catch (error) {
      handleError(set, error, "add payment");
    }
  },

  checkIfPaymentProcessed: async (uid: string, paymentId: string) => {
    if (!uid) return null;
    return await findProcessedPayment(uid, paymentId);
  },
}));

function handleError(
  set: (
    partial:
      | Partial<PaymentsStoreState>
      | ((state: PaymentsStoreState) => Partial<PaymentsStoreState>)
  ) => void,
  error: unknown,
  context: string
): void {
  const errorMessage = getErrorMessage(error);
  logError(`Payments - ${context}`, error);
  set({ paymentsError: errorMessage, paymentsLoading: false });
}

/**
 * Optimized selectors for payment state
 * Use these instead of directly accessing the store to prevent unnecessary re-renders
 */

// Individual payment data
export const usePayments = () => usePaymentsStore((state) => state.payments);
export const usePaymentsLoading = () => usePaymentsStore((state) => state.paymentsLoading);
export const usePaymentsError = () => usePaymentsStore((state) => state.paymentsError);

// Grouped selector for payment state
export const usePaymentsState = () => usePaymentsStore((state) => ({
  payments: state.payments,
  loading: state.paymentsLoading,
  error: state.paymentsError,
}));
