import { useAuthStore } from "@/zustand/useAuthStore";

const DEFAULT_TIMEOUT_MS = 15_000;
const POLL_MS = 50;

/**
 * Wait until Zustand reports authReady after Firebase sign-in/sign-up,
 * so durable session cookie sync has finished before navigation.
 */
export async function waitForSessionReady(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { authReady, uid } = useAuthStore.getState();
    if (authReady && uid) return true;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return false;
}

/**
 * Hard-navigate after session settle (avoids soft-nav AuthGuard races).
 */
export async function hardNavigateAfterAuth(path: string): Promise<void> {
  const ready = await waitForSessionReady();
  if (!ready) {
    throw new Error("Session sync timed out. Please try again.");
  }
  window.location.href = path;
}
