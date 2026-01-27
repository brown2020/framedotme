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
import { validateUserId } from "@/lib/validation";
import { getUserPaymentsPath } from "@/lib/firestore";

/**
 * Fetches all payments for a user from Firestore
 * Returns payments sorted by creation date (newest first)
 * 
 * @param uid - The user's unique identifier
 * @returns Promise resolving to array of payment records
 * @throws {ValidationError} If uid is invalid
 * 
 * @example
 * ```typescript
 * const payments = await fetchUserPayments(user.uid);
 * payments.forEach(p => console.log(p.amount));
 * ```
 */
export async function fetchUserPayments(uid: string): Promise<PaymentType[]> {
  const validatedUid = validateUserId(uid);
  const q = query(collection(db, getUserPaymentsPath(validatedUid)));
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
 * 
 * @param uid - The user's unique identifier
 * @param paymentId - The payment ID to check
 * @returns Promise resolving to true if payment exists, false otherwise
 * @throws {ValidationError} If uid is invalid
 */
export async function checkPaymentExists(
  uid: string,
  paymentId: string
): Promise<boolean> {
  const validatedUid = validateUserId(uid);
  const q = query(
    collection(db, getUserPaymentsPath(validatedUid)),
    where("id", "==", paymentId)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Creates a new payment record in Firestore
 * 
 * @param uid - The user's unique identifier
 * @param payment - Payment data (without createdAt, will be added automatically)
 * @returns Promise resolving to the created payment with createdAt
 * @throws {ValidationError} If uid is invalid
 */
export async function createPayment(
  uid: string,
  payment: Omit<PaymentType, "createdAt">
): Promise<PaymentType> {
  const validatedUid = validateUserId(uid);
  const newPaymentDoc = await addDoc(collection(db, getUserPaymentsPath(validatedUid)), {
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
 * Finds a processed (succeeded) payment by ID
 * 
 * @param uid - The user's unique identifier
 * @param paymentId - The payment ID to search for
 * @returns Promise resolving to the payment if found and succeeded, null otherwise
 * @throws {ValidationError} If uid is invalid
 */
export async function findProcessedPayment(
  uid: string,
  paymentId: string
): Promise<PaymentType | null> {
  const validatedUid = validateUserId(uid);
  const paymentsRef = collection(db, getUserPaymentsPath(validatedUid));
  const q = query(
    paymentsRef,
    where("id", "==", paymentId),
    where("status", "==", "succeeded")
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty && querySnapshot.docs[0]) {
    return querySnapshot.docs[0].data() as PaymentType;
  }

  return null;
}

/**
 * Sorts payments by creation date (newest first)
 * 
 * @param payments - Array of payments to sort
 * @returns Sorted array with newest payments first
 */
export function sortPayments(payments: PaymentType[]): PaymentType[] {
  return payments.sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
}
