import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { PaymentType } from "@/zustand/usePaymentsStore";
import { validateUserId } from "@/lib/validation";
import { getUserPaymentsPath } from "@/lib/firestore";

/**
 * Maps Firestore document data to PaymentType
 * @internal Helper function to maintain consistency in data mapping
 */
function mapDocumentToPayment(data: DocumentData, docId?: string): PaymentType {
  return {
    id: docId || data.id,
    amount: data.amount,
    createdAt: data.createdAt,
    status: data.status,
    mode: data.mode,
    currency: data.currency,
    platform: data.platform,
    productId: data.productId,
  };
}

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
  const payments = querySnapshot.docs.map((doc) => 
    mapDocumentToPayment(doc.data(), doc.id)
  );

  return sortPayments(payments);
}

/**
 * Checks if a payment with the given ID exists
 * Optimized to check by document ID rather than querying
 * 
 * @param uid - The user's unique identifier
 * @param paymentId - The payment ID to check (used as document ID)
 * @returns Promise resolving to true if payment exists, false otherwise
 * @throws {ValidationError} If uid is invalid
 */
export async function checkPaymentExists(
  uid: string,
  paymentId: string
): Promise<boolean> {
  const validatedUid = validateUserId(uid);
  
  // Check if payment exists by querying for the "id" field
  // (since we use custom IDs, not Firestore document IDs)
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
  const createdAt = Timestamp.now();
  
  const newPaymentDoc = await addDoc(collection(db, getUserPaymentsPath(validatedUid)), {
    id: payment.id,
    amount: payment.amount,
    createdAt,
    status: payment.status,
    mode: payment.mode,
    currency: payment.currency,
    platform: payment.platform,
    productId: payment.productId,
  });

  return {
    id: newPaymentDoc.id,
    amount: payment.amount,
    createdAt,
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
    const doc = querySnapshot.docs[0];
    return mapDocumentToPayment(doc.data());
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
