// utils/platform.ts

/**
 * Checks if code is running in a React Native WebView
 * @returns true if running in React Native WebView, false otherwise
 */
export function isReactNativeWebView(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return typeof window.ReactNativeWebView !== "undefined";
}

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use isReactNativeWebView instead
 */
export function isIOSReactNativeWebView(): boolean {
  return isReactNativeWebView();
}

const restrictedWords = [
  "nude", "naked", "sexual", "explicit", "porn", "erotic", "provocative", 
  "seductive", "intimate", "lingerie", "underwear", "bikini", "strip", 
  "sex", "breasts", "genital", "vagina", "penis", "buttocks", "bare",
  "inappropriate", "obscene", "lewd"
];

export const checkRestrictedWords = (imagePrompt: string): boolean => {
  return restrictedWords.some(word => imagePrompt.toLowerCase().includes(word));
};
