import toast from "react-hot-toast";

/**
 * Extracts a user-friendly error message from an unknown error
 */
export function getErrorMessage(error: unknown, defaultMessage = "An unknown error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

/**
 * Displays an error toast notification
 */
export function showErrorToast(error: unknown, defaultMessage?: string): void {
  const message = getErrorMessage(error, defaultMessage);
  toast.error(message);
}

/**
 * Logs an error to the console with context
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[${context}]`, message, error);
}

/**
 * Handles an error by logging it and optionally showing a toast
 */
export function handleError(
  context: string,
  error: unknown,
  options?: {
    showToast?: boolean;
    defaultMessage?: string;
  }
): string {
  const { showToast = false, defaultMessage } = options || {};
  const message = getErrorMessage(error, defaultMessage);
  
  logError(context, error);
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
}
