import { describe, expect, it } from "vitest";
import {
  getFirebaseAuthErrorCode,
  mapFirebaseAuthError,
} from "@/lib/firebaseAuthErrors";

describe("mapFirebaseAuthError", () => {
  it("maps invalid-credential", () => {
    expect(
      mapFirebaseAuthError({ code: "auth/invalid-credential", message: "raw" }),
    ).toMatch(/Incorrect email or password/i);
  });

  it("maps email-already-in-use", () => {
    expect(
      mapFirebaseAuthError({
        code: "auth/email-already-in-use",
        message: "raw",
      }),
    ).toMatch(/already exists/i);
  });

  it("maps weak-password", () => {
    expect(
      mapFirebaseAuthError({ code: "auth/weak-password", message: "raw" }),
    ).toMatch(/at least 6/i);
  });

  it("falls back for unknown codes", () => {
    expect(
      mapFirebaseAuthError({ code: "auth/something-new", message: "x" }),
    ).toBe("Something went wrong. Please try again.");
  });

  it("extracts code from message string", () => {
    expect(
      mapFirebaseAuthError(new Error("Firebase: Error (auth/too-many-requests).")),
    ).toMatch(/Too many attempts/i);
  });
});

describe("getFirebaseAuthErrorCode", () => {
  it("returns null for non-objects", () => {
    expect(getFirebaseAuthErrorCode(null)).toBeNull();
    expect(getFirebaseAuthErrorCode("x")).toBeNull();
  });
});
