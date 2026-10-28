import { describe, expect, it } from "vitest";
import {
  screenCaptureFailureMessage,
  screenCaptureUnavailableMessage,
} from "@/lib/screenCaptureError";

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("screenCaptureUnavailableMessage", () => {
  it("explains an insecure page and a missing capture API", () => {
    expect(
      screenCaptureUnavailableMessage({ isSecureContext: false, hasGetDisplayMedia: true }),
    ).toMatch(/secure HTTPS/);
    expect(
      screenCaptureUnavailableMessage({ isSecureContext: true, hasGetDisplayMedia: false }),
    ).toMatch(/not supported/);
    expect(
      screenCaptureUnavailableMessage({ isSecureContext: true, hasGetDisplayMedia: true }),
    ).toBeNull();
  });
});

describe("screenCaptureFailureMessage", () => {
  it("names denial, security blocks, and other capture failures", () => {
    expect(screenCaptureFailureMessage(namedError("NotAllowedError"))).toMatch(/canceled or blocked/);
    expect(screenCaptureFailureMessage(namedError("SecurityError"))).toMatch(/not allowed/);
    expect(screenCaptureFailureMessage(namedError("NotFoundError"))).toMatch(/No screen/);
    expect(screenCaptureFailureMessage(namedError("NotReadableError"))).toMatch(/could not be captured/);
    expect(screenCaptureFailureMessage(new Error("boom"))).toMatch(/could not start/);
    expect(screenCaptureFailureMessage(undefined)).toMatch(/could not start/);
  });
});
