import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/stripe/webhook/route";

describe("stripe webhook", () => {
  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("stays up and grants nothing when the webhook secret is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe webhook is not configured",
    });
  });
});
