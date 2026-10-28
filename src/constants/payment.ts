/**
 * Payment and credits constants
 */

// Credits
/** Starter balance written once when a profile document is created. */
export const DEFAULT_CREDITS = 1000;
/** Credits consumed server-side each time a recording is saved. */
export const RECORDING_CREDIT_COST = 100;

// Payment — integer cents are the source of truth (avoids float drift).
export const CREDIT_PACK_AMOUNT_CENTS = 9999;
export const CREDIT_PACK_CREDITS = 10_000;
export const DEFAULT_PAYMENT_AMOUNT = CREDIT_PACK_AMOUNT_CENTS / 100;
export const DEFAULT_PAYMENT_CURRENCY = "usd";
export const MINIMUM_PAYMENT_AMOUNT_CENTS = 50; // Stripe minimum

/**
 * Returns an error message when `amountCents` is not the fixed credit pack, otherwise null.
 */
export function creditPackAmountError(amountCents: number): string | null {
  if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents) || amountCents <= 0) {
    return "Amount must be a positive integer (in cents)";
  }
  if (amountCents !== CREDIT_PACK_AMOUNT_CENTS) {
    return "Amount does not match the credit pack price";
  }
  return null;
}
