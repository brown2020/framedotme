/**
 * Converts an amount to subcurrency (e.g., dollars to cents)
 * 
 * @param amount - The amount in main currency units
 * @param factor - The conversion factor (default: 100 for cents)
 * @returns The amount in subcurrency units, rounded
 */
export default function convertToSubcurrency(amount: number, factor = 100): number {
  return Math.round(amount * factor);
}
