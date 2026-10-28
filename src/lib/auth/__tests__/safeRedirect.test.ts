import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "@/lib/auth/safeRedirect";

describe("isSafeRedirectPath", () => {
  it("allows same-origin app paths", () => {
    expect(isSafeRedirectPath("/capture")).toBe(true);
    expect(isSafeRedirectPath("/recordings?tab=1")).toBe(true);
  });

  it("rejects protocol-relative and backslash redirects", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
    expect(isSafeRedirectPath("/\\/evil.com")).toBe(false);
    expect(isSafeRedirectPath("/%5Cevil.com")).toBe(false);
    expect(isSafeRedirectPath("https://evil.com")).toBe(false);
    expect(isSafeRedirectPath("/%09/evil.com")).toBe(false);
  });
});
