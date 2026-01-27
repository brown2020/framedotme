import toast from "react-hot-toast";
import { getErrorMessage } from "./errorFormatters";

/**
 * Error notification utilities
 * Handles displaying errors to users via toast notifications
 */

/**
 * Displays an error toast notification with context
 */
export const showErrorToast = (error: unknown, defaultMessage?: string, operation?: string): void => {
  const message = getErrorMessage(error, defaultMessage, operation);
  toast.error(message);
};

/**
 * Handles an error by logging it and optionally showing a toast
 */
export const handleError = (
  context: string,
  error: unknown,
  options?: {
    showToast?: boolean;
    defaultMessage?: string;
    operation?: string;
  }
): string => {
  const { showToast = false, defaultMessage, operation } = options || {};
  const message = getErrorMessage(error, defaultMessage, operation);
  
  console.error(`[${context}]`, message, error);
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
};
