import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";
import { DELETE, GET, POST } from "@/app/api/session/route";

function sessionRequest(method: string, init?: { csrf?: string; body?: string }) {
  const headers = new Headers();
  if (init?.csrf) {
    headers.set("cookie", `${CSRF_COOKIE_NAME}=${init.csrf}`);
    headers.set(CSRF_HEADER_NAME, init.csrf);
  }
  if (init?.body) {
    headers.set("content-type", "application/json");
  }
  return new Request("http://localhost/api/session", {
    method,
    headers,
    body: init?.body,
  });
}

describe("session route", () => {
  it("issues a CSRF cookie for the sign-in flow", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain(CSRF_COOKIE_NAME);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects session creation without a CSRF token", async () => {
    const response = await POST(sessionRequest("POST", { body: JSON.stringify({ idToken: "x" }) }));

    expect(response.status).toBe(403);
  });

  it("rejects session creation when the Firebase id token is missing", async () => {
    const response = await POST(
      sessionRequest("POST", { csrf: "csrf-token-value-1234567890", body: JSON.stringify({}) }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing idToken" });
  });

  it("rejects sign-out without a CSRF token", async () => {
    const response = await DELETE(sessionRequest("DELETE"));

    expect(response.status).toBe(403);
  });
});
