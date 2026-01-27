import { create } from "zustand";
import { Timestamp } from "firebase/firestore";
import { getErrorMessage, logError } from "@/utils/errorHandling";
import { logger } from "@/utils/logger";
import {
  fetchUserPayments,
  checkPaymentExists,
  createPayment,
  findProcessedPayment,
  sortPayments,
} from "@/services/paymentsService";

export type PaymentType = {
  id: string;
  amount: number;
  createdAt: Timestamp | null;
  status: string;
  mode: string;
  platform: string;
  productId: string;
  currency: string;
};

interface PaymentsStoreState {
  payments: PaymentType[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  fetchPayments: (uid: string) => Promise<void>;
  addPayment: (uid: string, payment: Omit<PaymentType, "createdAt">) => Promise<void>;
  checkIfPaymentProcessed: (uid: string, paymentId: string) => Promise<PaymentType | null>;
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

  addPayment: async (uid: string, payment: Omit<PaymentType, "createdAt">) => {
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

// Selectors for optimized re-renders
export const usePayments = () => usePaymentsStore((state) => state.payments);
export const usePaymentsLoading = () => usePaymentsStore((state) => state.paymentsLoading);
export const usePaymentsError = () => usePaymentsStore((state) => state.paymentsError);
