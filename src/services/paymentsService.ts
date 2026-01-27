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
import type { Payment, PaymentInput, PaymentStatus } from "@/types/payment";
import { validateUserId } from "@/lib/validation";
import { getUserPaymentsPath } from "@/lib/firestore";

/**
 * Maps Firestore document data to Payment
 * Uses the id field from the document data (which stores the Stripe payment intent ID)
 * 
 * @param data - The Firestore document data
 * @returns Mapped payment object
 * 
 * @internal Helper function to maintain consistency in data mapping
 */
const mapDocumentToPayment = (data: DocumentData): Payment => {
  return {
    id: data.id as string,
    amount: data.amount as number,
    createdAt: data.createdAt as Payment["createdAt"],
    status: data.status as PaymentStatus,
    mode: data.mode as Payment["mode"],
    currency: data.currency as string,
    platform: data.platform as Payment["platform"],
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
export const fetchUserPayments = async (uid: string): Promise<Payment[]> => {
  const validatedUid = validateUserId(uid);
  
  try {
    const q = query(collection(db, getUserPaymentsPath(validatedUid)));
    const querySnapshot = await getDocs(q);
    
    // Map each Firestore document to Payment
    const payments = querySnapshot.docs.map((doc) => 
      mapDocumentToPayment(doc.data())
    );

    return sortPayments(payments);
  } catch (error) {
    throw error;
  }
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
  
  try {
    // Check if payment exists by querying for the "id" field
    // (since we use custom IDs, not Firestore document IDs)
    const q = query(
      collection(db, getUserPaymentsPath(validatedUid)),
      where("id", "==", paymentId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    throw error;
  }
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
  payment: PaymentInput
): Promise<Payment> => {
  const validatedUid = validateUserId(uid);
  const createdAt = Timestamp.now();
  
  try {
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
  } catch (error) {
    throw error;
  }
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
): Promise<Payment | null> => {
  const validatedUid = validateUserId(uid);
  
  try {
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
  } catch (error) {
    throw error;
  }
};

/**
 * Sorts payments by creation date (newest first)
 * 
 * @param payments - Array of payments to sort
 * @returns Sorted array with newest payments first
 */
export const sortPayments = (payments: Payment[]): Payment[] => {
  return payments.sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
};
