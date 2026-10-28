import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/services/sessionService", () => ({
  requireAuthenticatedSession: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { requireAuthenticatedSession } from "@/services/sessionService";
import { createPaymentIntent, validatePaymentIntent } from "@/actions/paymentActions";
import { AppError } from "@/types/errors";

describe("paymentActions auth + validation denial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("denies createPaymentIntent for unauthenticated callers", async () => {
    vi.mocked(requireAuthenticatedSession).mockRejectedValue(
      new AppError("Authentication required", "authentication"),
    );
    await expect(createPaymentIntent(1000)).rejects.toThrow(/Authentication required/);
  });

  it("rejects non-positive amounts before Stripe", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      uid: "user_1",
      email: "a@b.co",
      emailVerified: true,
    });
    await expect(createPaymentIntent(0)).rejects.toThrow(/positive integer/);
    await expect(createPaymentIntent(-5)).rejects.toThrow(/positive integer/);
  });

  it("rejects amounts that are not the credit pack", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      uid: "user_1",
      email: "a@b.co",
      emailVerified: true,
    });
    await expect(createPaymentIntent(50)).rejects.toThrow(/credit pack/);
  });

  it("rejects unverified emails before Stripe", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      uid: "user_1",
      email: "a@b.co",
      emailVerified: false,
    });
    await expect(createPaymentIntent(9999)).rejects.toThrow(/Verify your email/);
  });

  it("denies validatePaymentIntent for unauthenticated callers", async () => {
    vi.mocked(requireAuthenticatedSession).mockRejectedValue(
      new AppError("Authentication required", "authentication"),
    );
    await expect(validatePaymentIntent("pi_test123")).rejects.toThrow(
      /Authentication required/,
    );
  });

  it("rejects invalid payment intent ids", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      uid: "user_1",
      email: "a@b.co",
      emailVerified: true,
    });
    await expect(validatePaymentIntent("not-an-id")).rejects.toThrow(
      /Invalid payment intent/,
    );
  });
});
