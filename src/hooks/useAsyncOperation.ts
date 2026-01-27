import { useState, useCallback } from "react";
import { logger } from "@/utils/logger";

/**
 * Generic hook for handling async operations with loading, error, and data states
 * 
 * @template T The type of data returned by the operation
 * @returns Object containing data, loading state, error, and execute function
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useAsyncOperation<VideoMetadata[]>();
 * 
 * // In useEffect or event handler:
 * execute(() => fetchUserRecordings(uid));
 * ```
 */
export function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      logger.error('Async operation failed', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
