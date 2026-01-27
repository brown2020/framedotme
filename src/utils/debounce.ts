/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @template T - The function type to debounce
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function with a cancel method
 * 
 * @example
 * ```typescript
 * const debouncedSave = debounce((value: string) => {
 *   saveToDatabase(value);
 * }, 1000);
 * 
 * // Later, to cancel pending execution
 * debouncedSave.cancel();
 * ```
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } => {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };
  
  return debounced;
};
