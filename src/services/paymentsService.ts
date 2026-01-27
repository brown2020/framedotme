import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { PaymentType } from "@/zustand/usePaymentsStore";

/**
 * Fetches all payments for a user from Firestore
 */
export async function fetchUserPayments(uid: string): Promise<PaymentType[]> {
  const q = query(collection(db, "users", uid, "payments"));
  const querySnapshot = await getDocs(q);
  const payments = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    amount: doc.data().amount,
    createdAt: doc.data().createdAt,
    status: doc.data().status,
    mode: doc.data().mode,
    currency: doc.data().currency,
    platform: doc.data().platform,
    productId: doc.data().productId,
  }));

  return sortPayments(payments);
}

/**
 * Checks if a payment with the given ID exists
 */
export async function checkPaymentExists(
  uid: string,
  paymentId: string
): Promise<boolean> {
  const q = query(
    collection(db, "users", uid, "payments"),
    where("id", "==", paymentId)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Creates a new payment record in Firestore
 */
export async function createPayment(
  uid: string,
  payment: Omit<PaymentType, "createdAt">
): Promise<PaymentType> {
  const newPaymentDoc = await addDoc(collection(db, "users", uid, "payments"), {
    id: payment.id,
    amount: payment.amount,
    createdAt: Timestamp.now(),
    status: payment.status,
    mode: payment.mode,
    currency: payment.currency,
    platform: payment.platform,
    productId: payment.productId,
  });

  return {
    id: newPaymentDoc.id,
    amount: payment.amount,
    createdAt: Timestamp.now(),
    status: payment.status,
    mode: payment.mode,
    currency: payment.currency,
    platform: payment.platform,
    productId: payment.productId,
  };
}

/**
 * Finds a processed payment by ID
 */
export async function findProcessedPayment(
  uid: string,
  paymentId: string
): Promise<PaymentType | null> {
  const paymentsRef = collection(db, "users", uid, "payments");
  const q = query(
    paymentsRef,
    where("id", "==", paymentId),
    where("status", "==", "succeeded")
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as PaymentType;
  }

  return null;
}

/**
 * Sorts payments by creation date (newest first)
 */
export function sortPayments(payments: PaymentType[]): PaymentType[] {
  return payments.sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
}
