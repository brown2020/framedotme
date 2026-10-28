/**
 * Pure checks for the server-side session map stored at
 * `users/{uid}/security/session` as `{ sessions: { [jti]: expiresAtMs } }`.
 */

export function isActiveSessionJti(
  sessions: Record<string, unknown> | null | undefined,
  jti: string,
  now: number,
): boolean {
  if (!jti || !sessions) return false;
  const expiresAt = sessions[jti];
  return typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt > now;
}

/** Drops expired entries and keeps the newest sessions within `maxActive`. */
export function pruneSessions(
  sessions: Record<string, unknown> | null | undefined,
  now: number,
  maxActive: number,
): Record<string, number> {
  const active = Object.entries(sessions ?? {}).flatMap(([jti, expiresAt]) => {
    if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt <= now) {
      return [];
    }
    return [[jti, expiresAt] as const];
  });
  active.sort((a, b) => a[1] - b[1]);
  const kept = active.slice(Math.max(0, active.length - maxActive));
  return Object.fromEntries(kept);
}
