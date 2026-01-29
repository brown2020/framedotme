import type { DocumentData } from "firebase/firestore";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import type { Payment, PaymentInput } from "@/types/payment";
import { db } from "@/firebase/firebaseClient";
import { getUserPaymentsPath } from "@/lib/firestore";
import { firestoreRead, firestoreWrite } from "@/lib/firestoreOperations";
import { PaymentSchema, validateUserId } from "@/lib/validation";

/** Maps Firestore document data to Payment with runtime validation */
const mapDocumentToPayment = (data: DocumentData): Payment => {
  const payment = {
    id: data.id,
    amount: data.amount,
    createdAt: data.createdAt,
    status: data.status,
    mode: data.mode,
    currency: data.currency,
    platform: data.platform,
    productId: data.productId,
  };

  // Validate with Zod schema - .catch() will provide defaults for invalid values
  return PaymentSchema.parse(payment);
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
export async function fetchUserPayments(uid: string): Promise<Payment[]> {
  const validatedUid = validateUserId(uid);

  return firestoreRead(
    async () => {
      // Wait for Firebase auth to be initialized before querying
      // This ensures request.auth is available in Firestore security rules
      const { auth } = await import("@/firebase/firebaseClient");

      if (!auth.currentUser) {
        throw new Error(
          "Firebase auth not initialized - user not authenticated",
        );
      }

      const q = query(collection(db, getUserPaymentsPath(validatedUid)));
      const querySnapshot = await getDocs(q);

      // Map each Firestore document to Payment, including document ID for unique keys
      const payments = querySnapshot.docs.map((doc) => ({
        ...mapDocumentToPayment(doc.data()),
        docId: doc.id, // Add Firestore document ID for React keys
      }));

      return sortPayments(payments);
    },
    "Failed to fetch user payments",
    { userId: validatedUid },
  );
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
  paymentId: string,
): Promise<boolean> {
  const validatedUid = validateUserId(uid);

  return firestoreRead(
    async () => {
      // Check if payment exists by querying for the "id" field
      // (since we use custom IDs, not Firestore document IDs)
      const q = query(
        collection(db, getUserPaymentsPath(validatedUid)),
        where("id", "==", paymentId),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    },
    "Failed to check payment existence",
    { userId: validatedUid, paymentId },
  );
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
  payment: PaymentInput,
): Promise<Payment> {
  const validatedUid = validateUserId(uid);
  const createdAt = Timestamp.now();

  await firestoreWrite(
    () =>
      addDoc(collection(db, getUserPaymentsPath(validatedUid)), {
        id: payment.id,
        amount: payment.amount,
        createdAt,
        status: payment.status,
        mode: payment.mode,
        currency: payment.currency,
        platform: payment.platform,
        productId: payment.productId,
      }),
    "Failed to create payment record",
    { userId: validatedUid, paymentId: payment.id },
  );

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
  paymentId: string,
): Promise<Payment | null> {
  const validatedUid = validateUserId(uid);

  return firestoreRead(
    async () => {
      const paymentsRef = collection(db, getUserPaymentsPath(validatedUid));
      const q = query(
        paymentsRef,
        where("id", "==", paymentId),
        where("status", "==", "succeeded"),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const doc = querySnapshot.docs[0];
        return mapDocumentToPayment(doc.data());
      }

      return null;
    },
    "Failed to find processed payment",
    { userId: validatedUid, paymentId },
  );
}

/**
 * Sorts payments by creation date (newest first)
 *
 * @param payments - Array of payments to sort
 * @returns Sorted array with newest payments first
 */
export function sortPayments(payments: Payment[]): Payment[] {
  return payments.sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
  );
}
