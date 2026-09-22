import { describe, expect, it } from "vitest";
import { validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";

describe("validateCsrfToken", () => {
  it("denies when cookie and header are missing", () => {
    const req = new Request("http://localhost/api/session", { method: "POST" });
    const result = validateCsrfToken(req);
    expect(result.valid).toBe(false);
  });

  it("denies when cookie and header mismatch", () => {
    const req = new Request("http://localhost/api/session", {
      method: "POST",
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=aaa`,
        [CSRF_HEADER_NAME]: "bbb",
      },
    });
    const result = validateCsrfToken(req);
    expect(result.valid).toBe(false);
  });

  it("accepts matching cookie and header", () => {
    const token = "csrf-token-value-1234567890";
    const req = new Request("http://localhost/api/session", {
      method: "POST",
      headers: {
        cookie: `${CSRF_COOKIE_NAME}=${token}`,
        [CSRF_HEADER_NAME]: token,
      },
    });
    const result = validateCsrfToken(req);
    expect(result.valid).toBe(true);
  });
});
