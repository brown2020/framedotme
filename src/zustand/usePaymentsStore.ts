import { create } from "zustand";
import { getErrorMessage, logError } from "@/lib/errors";
import { logger } from "@/utils/logger";
import {
  fetchUserPayments,
  findProcessedPayment,
} from "@/services/paymentsService";
import type { Payment } from "@/types/payment";

interface PaymentsStoreState {
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  fetchPayments: (uid: string) => Promise<void>;
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
      const errorMessage = getErrorMessage(error);
      logError("Payments - fetch payments", error);
      set({ paymentsError: errorMessage, paymentsLoading: false });
    }
  },

  checkIfPaymentProcessed: async (uid: string, paymentId: string) => {
    if (!uid) return null;
    return await findProcessedPayment(uid, paymentId);
  },
}));
