/**
 * Content moderation constants for user-generated content
 */

/**
 * List of restricted words that are not allowed in user-generated content
 * Used for content moderation and filtering
 */
export const RESTRICTED_WORDS = [
  "nude",
  "naked",
  "sexual",
  "explicit",
  "porn",
  "erotic",
  "provocative",
  "seductive",
  "intimate",
  "lingerie",
  "underwear",
  "bikini",
  "strip",
  "sex",
  "breasts",
  "genital",
  "vagina",
  "penis",
  "buttocks",
  "bare",
  "inappropriate",
  "obscene",
  "lewd",
] as const;

/**
 * Checks if a given text contains any restricted words
 * 
 * @param text - The text to check for restricted content
 * @returns true if restricted words are found, false otherwise
 * 
 * @example
 * ```typescript
 * if (checkRestrictedWords(userPrompt)) {
 *   showError("Content contains inappropriate words");
 * }
 * ```
 */
export const checkRestrictedWords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return RESTRICTED_WORDS.some((word) => lowerText.includes(word));
};
