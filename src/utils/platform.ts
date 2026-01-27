/**
 * Platform detection utilities for cross-platform compatibility
 */

/**
 * Checks if code is running in a React Native WebView
 * @returns true if running in React Native WebView, false otherwise
 */
export const isReactNativeWebView = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return typeof window.ReactNativeWebView !== "undefined";
};

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use isReactNativeWebView instead
 */
export const isIOSReactNativeWebView = (): boolean => {
  return isReactNativeWebView();
};
