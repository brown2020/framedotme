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
 * Uses the id field from the document data (which stores the Stripe payment intent ID)
 * 
 * @param data - The Firestore document data
 * @returns Mapped payment object
 * 
 * @internal Helper function to maintain consistency in data mapping
 */
const mapDocumentToPayment = (data: DocumentData): PaymentType => {
  return {
    id: data.id as string,
    amount: data.amount as number,
    createdAt: data.createdAt as PaymentType["createdAt"],
    status: data.status as string,
    mode: data.mode as string,
    currency: data.currency as string,
    platform: data.platform as string,
    productId: data.productId as string,
  };
};

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
export const fetchUserPayments = async (uid: string): Promise<PaymentType[]> => {
  const validatedUid = validateUserId(uid);
  const q = query(collection(db, getUserPaymentsPath(validatedUid)));
  const querySnapshot = await getDocs(q);
  
  // Map each Firestore document to PaymentType
  const payments = querySnapshot.docs.map((doc) => 
    mapDocumentToPayment(doc.data())
  );

  return sortPayments(payments);
};

/**
 * Checks if a payment with the given ID exists
 * Optimized to check by document ID rather than querying
 * 
 * @param uid - The user's unique identifier
 * @param paymentId - The payment ID to check (used as document ID)
 * @returns Promise resolving to true if payment exists, false otherwise
 * @throws {ValidationError} If uid is invalid
 */
export const checkPaymentExists = async (
  uid: string,
  paymentId: string
): Promise<boolean> => {
  const validatedUid = validateUserId(uid);
  
  // Check if payment exists by querying for the "id" field
  // (since we use custom IDs, not Firestore document IDs)
  const q = query(
    collection(db, getUserPaymentsPath(validatedUid)),
    where("id", "==", paymentId)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

/**
 * Creates a new payment record in Firestore
 * 
 * @param uid - The user's unique identifier
 * @param payment - Payment data (without createdAt, will be added automatically)
 * @returns Promise resolving to the created payment with createdAt
 * @throws {ValidationError} If uid is invalid
 */
export const createPayment = async (
  uid: string,
  payment: Omit<PaymentType, "createdAt">
): Promise<PaymentType> => {
  const validatedUid = validateUserId(uid);
  const createdAt = Timestamp.now();
  
  await addDoc(collection(db, getUserPaymentsPath(validatedUid)), {
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
    id: payment.id,
    amount: payment.amount,
    createdAt,
    status: payment.status,
    mode: payment.mode,
    currency: payment.currency,
    platform: payment.platform,
    productId: payment.productId,
  };
};

/**
 * Finds a processed (succeeded) payment by ID
 * 
 * @param uid - The user's unique identifier
 * @param paymentId - The payment ID to search for
 * @returns Promise resolving to the payment if found and succeeded, null otherwise
 * @throws {ValidationError} If uid is invalid
 */
export const findProcessedPayment = async (
  uid: string,
  paymentId: string
): Promise<PaymentType | null> => {
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
};

/**
 * Sorts payments by creation date (newest first)
 * 
 * @param payments - Array of payments to sort
 * @returns Sorted array with newest payments first
 */
export const sortPayments = (payments: PaymentType[]): PaymentType[] => {
  return payments.sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
};
