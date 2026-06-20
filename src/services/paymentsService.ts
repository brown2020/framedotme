import type { DocumentData } from "firebase/firestore";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction,
  doc,
  increment,
} from "firebase/firestore";

import type { Payment, PaymentInput } from "@/types/payment";
import { db } from "@/firebase/firebaseClient";
import { getUserPaymentsPath, getUserProfilePath } from "@/lib/firestore";
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

const buildPaymentRecord = (
  payment: PaymentInput,
  createdAt: Timestamp,
): Payment => ({
  id: payment.id,
  amount: payment.amount,
  createdAt,
  status: payment.status,
  mode: payment.mode,
  currency: payment.currency,
  platform: payment.platform,
  productId: payment.productId,
});

/**
 * Result of an idempotent payment processing operation
 */
export interface ProcessPaymentWithCreditsResult {
  /** The payment record (either newly created or existing) */
  payment: Payment;
  /** Whether the payment already existed (true) or was just created (false) */
  alreadyExists: boolean;
  /** Credits added by this call. Existing payments add zero credits. */
  creditsAdded: number;
}

/**
 * Records a successful payment and adds credits atomically.
 *
 * This function is idempotent for a payment ID. If the payment already exists,
 * it returns the existing record and does not add credits again. If it is new,
 * the payment document and credit increment are committed in the same transaction.
 *
 * @param uid - The user's unique identifier
 * @param payment - Payment data (without createdAt, will be added automatically)
 * @param creditsToAdd - Number of credits to add for a newly processed payment
 * @returns Promise resolving to the payment, duplicate status, and credits added
 * @throws {AppError} If the transaction fails (not for duplicate detection)
 */
export async function processPaymentWithCreditsIdempotent(
  uid: string,
  payment: PaymentInput,
  creditsToAdd: number,
): Promise<ProcessPaymentWithCreditsResult> {
  const validatedUid = validateUserId(uid);
  const paymentsCollectionPath = getUserPaymentsPath(validatedUid);
  const profilePath = getUserProfilePath(validatedUid);

  if (
    !Number.isFinite(creditsToAdd) ||
    !Number.isInteger(creditsToAdd) ||
    creditsToAdd <= 0
  ) {
    throw new Error("creditsToAdd must be a positive integer");
  }

  return firestoreWrite(
    async () => {
      // Ensure Firebase auth is ready
      const { auth } = await import("@/firebase/firebaseClient");
      if (!auth.currentUser) {
        throw new Error("Firebase auth not initialized - user not authenticated");
      }

      // Backward compatibility: older code wrote payment records under random
      // Firestore IDs, so check those before the deterministic transaction path.
      const legacyPaymentQuery = query(
        collection(db, paymentsCollectionPath),
        where("id", "==", payment.id),
      );
      const legacyPaymentSnapshot = await getDocs(legacyPaymentQuery);
      if (!legacyPaymentSnapshot.empty && legacyPaymentSnapshot.docs[0]) {
        return {
          payment: mapDocumentToPayment(legacyPaymentSnapshot.docs[0].data()),
          alreadyExists: true,
          creditsAdded: 0,
        };
      }

      const result = await runTransaction(db, async (transaction) => {
        // Prefer deterministic document IDs for new Stripe payment records.
        const paymentDocRef = doc(db, paymentsCollectionPath, payment.id);
        const existingByDocId = await transaction.get(paymentDocRef);
        if (existingByDocId.exists()) {
          return {
            payment: mapDocumentToPayment(existingByDocId.data()),
            alreadyExists: true,
            creditsAdded: 0,
          };
        }

        const createdAt = Timestamp.now();
        const newPaymentData = buildPaymentRecord(payment, createdAt);
        const profileRef = doc(db, profilePath);

        transaction.set(paymentDocRef, newPaymentData);
        transaction.set(
          profileRef,
          { credits: increment(creditsToAdd) },
          { merge: true },
        );

        return {
          payment: newPaymentData,
          alreadyExists: false,
          creditsAdded: creditsToAdd,
        };
      });

      return result;
    },
    "Failed to process payment and credits",
    { userId: validatedUid, paymentId: payment.id },
  );
}
