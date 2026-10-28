import { describe, expect, it } from "vitest";
import { isSafeRedirectPath, pathOnCurrentOrigin } from "@/lib/auth/safeRedirect";

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

describe("pathOnCurrentOrigin", () => {
  const preview = "https://framedotme-git-dev-preview.vercel.app";

  it("keeps a preview login on the preview host", () => {
    expect(pathOnCurrentOrigin("/capture", preview)).toBe("/capture");
    expect(pathOnCurrentOrigin("https://frame.me/capture", preview)).toBe("/capture");
    expect(pathOnCurrentOrigin("https://www.frame.me/profile", preview)).toBe("/capture");
    expect(pathOnCurrentOrigin("https://evil.com/capture", preview)).toBe("/capture");
    expect(pathOnCurrentOrigin("/\\evil.com", preview)).toBe("/capture");
  });
});
