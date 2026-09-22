import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("server-only", () => ({}));

import { cookies } from "next/headers";
import {
  getAuthenticatedSession,
  requireAuthenticatedSession,
  verifySessionToken,
} from "@/services/sessionService";
import { AppError } from "@/types/errors";

describe("sessionService auth denial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "x".repeat(32);
  });

  it("returns null for empty session token", async () => {
    await expect(verifySessionToken("")).resolves.toBeNull();
  });

  it("returns null for invalid session token", async () => {
    await expect(verifySessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("denies requireAuthenticatedSession when cookie missing", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    await expect(requireAuthenticatedSession()).rejects.toBeInstanceOf(AppError);
    await expect(requireAuthenticatedSession()).rejects.toThrow(/Authentication required/);
  });

  it("getAuthenticatedSession returns null without cookie", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    await expect(getAuthenticatedSession()).resolves.toBeNull();
  });
});
