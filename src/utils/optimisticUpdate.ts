/**
 * Optimistic Update Utility
 *
 * Provides transaction-like semantics for optimistic updates in Zustand stores.
 * Prevents race conditions by using operation versioning and queuing.
 *
 * The problem with naive optimistic updates:
 * 1. Read current state (e.g., credits = 100)
 * 2. Calculate new state (credits = 100 - 10 = 90)
 * 3. Set optimistic state
 * 4. Call API
 * 5. On failure, rollback to "previous state"
 *
 * Race condition when two operations overlap:
 * T=0: Op1 reads credits=100, calculates 90, sets optimistic
 * T=10: Op2 reads credits=90 (wrong! should see 100), calculates 80
 * T=20: Op1 API fails, rolls back to 100
 * T=30: Op2 completes, credits=80 (should be 90 after one successful -10)
 *
 * Solution: Operation queue with version tracking
 *
 * @example
 * ```typescript
 * const creditOperations = new OperationQueue<void>();
 *
 * async function minusCredits(uid: string, amount: number) {
 *   return creditOperations.execute(
 *     // Get current value
 *     () => get().profile.credits,
 *     // Calculate new value
 *     (current) => current - amount,
 *     // Apply optimistic update
 *     (newValue) => set({ profile: { ...get().profile, credits: newValue } }),
 *     // Perform actual operation
 *     async (newValue) => { await updateUserProfile(uid, { credits: newValue }); },
 *     // Rollback on failure
 *     (previousValue) => set({ profile: { ...get().profile, credits: previousValue } })
 *   );
 * }
 * ```
 */

interface QueuedOperation {
  id: number;
  resolve: () => void;
  reject: (error: Error) => void;
  execute: () => Promise<void>;
}

/**
 * Operation queue that ensures sequential execution of operations.
 * Each operation sees the result of the previous operation.
 *
 * @typeParam T - The type of value being operated on (e.g., number for credits)
 */
export class OperationQueue<T> {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private operationCounter = 0;

  /**
   * Executes an operation with proper isolation.
   *
   * Operations are queued and executed sequentially to prevent race conditions.
   * Each operation sees the state after all previous operations have completed.
   *
   * @param getCurrentValue - Function to get current value from state
   * @param calculateNewValue - Function to calculate new value from current
   * @param applyOptimistic - Function to apply optimistic update
   * @param performOperation - Async function to perform the actual operation
   * @param rollback - Function to rollback on failure
   * @returns Promise that resolves when operation completes
   */
  async execute(
    getCurrentValue: () => T,
    calculateNewValue: (current: T) => T,
    applyOptimistic: (newValue: T) => void,
    performOperation: (newValue: T) => Promise<void>,
    rollback: (previousValue: T) => void
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const operationId = ++this.operationCounter;

      const executeOp = async (): Promise<void> => {
        const previousValue = getCurrentValue();
        const newValue = calculateNewValue(previousValue);

        // Apply optimistic update
        applyOptimistic(newValue);

        try {
          // Perform actual operation
          await performOperation(newValue);
        } catch (error) {
          // Rollback on failure
          rollback(previousValue);
          throw error;
        }
      };

      this.queue.push({
        id: operationId,
        resolve,
        reject,
        execute: executeOp,
      });

      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (!operation) break;

      try {
        await operation.execute();
        operation.resolve();
      } catch (error) {
        operation.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Gets the current queue length (useful for testing/debugging)
   */
  get pendingOperations(): number {
    return this.queue.length;
  }

  /**
   * Clears all pending operations (useful for cleanup/reset)
   */
  clear(): void {
    const pendingOps = [...this.queue];
    this.queue = [];

    // Reject all pending operations
    pendingOps.forEach((op) => {
      op.reject(new Error("Operation cancelled: queue cleared"));
    });
  }
}

/**
 * Creates a simple operation queue for credit operations.
 * Use this for all credit modifications to prevent race conditions.
 */
export function createCreditOperationQueue(): OperationQueue<number> {
  return new OperationQueue<number>();
}
