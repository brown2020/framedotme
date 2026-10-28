import { describe, expect, it } from "vitest";
import {
  CREDIT_PACK_AMOUNT_CENTS,
  CREDIT_PACK_CREDITS,
  creditPackAmountError,
} from "@/constants/payment";
import { isActiveSessionJti, pruneSessions } from "@/lib/security/sessionRecord";
import { readFileSync } from "node:fs";

describe("credit pack price", () => {
  it("accepts only the fixed pack", () => {
    expect(creditPackAmountError(CREDIT_PACK_AMOUNT_CENTS)).toBeNull();
    expect(CREDIT_PACK_CREDITS).toBe(10_000);
    expect(creditPackAmountError(50)).toMatch(/credit pack/);
    expect(creditPackAmountError(0)).toMatch(/positive integer/);
    expect(creditPackAmountError(99.99)).toMatch(/positive integer/);
  });
});

describe("session registry helpers", () => {
  it("accepts an unexpired jti and rejects missing or expired ones", () => {
    const now = 1_000;
    expect(isActiveSessionJti({ abc: 1_500 }, "abc", now)).toBe(true);
    expect(isActiveSessionJti({ abc: 1_000 }, "abc", now)).toBe(false);
    expect(isActiveSessionJti({ abc: 1_500 }, "other", now)).toBe(false);
    expect(isActiveSessionJti(undefined, "abc", now)).toBe(false);
  });

  it("drops expired sessions and keeps the newest entries", () => {
    const pruned = pruneSessions(
      { old: 10, mid: 20, fresh: 30 },
      15,
      1,
    );
    expect(pruned).toEqual({ fresh: 30 });
  });
});

describe("security rules", () => {
  const firestore = readFileSync("firestore.rules", "utf8");
  const storage = readFileSync("storage.rules", "utf8");

  it("locks credits and payments to the server", () => {
    expect(firestore).toMatch(/allow create, update, delete: if false;/);
    expect(firestore).toMatch(/request\.resource\.data\.credits == 1000/);
    expect(firestore).toMatch(/request\.resource\.data\.credits == resource\.data\.credits/);
    expect(firestore).toContain("privilegesUnchanged()");
  });

  it("requires a video grant for storage creates", () => {
    expect(storage).toMatch(/video\/webm/);
    expect(storage).toMatch(/uploadGrants/);
    expect(storage).toMatch(/allow update: if false/);
    expect(storage).toMatch(/allow list: if false/);
  });
});
