import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

import { deleteCookie, getCookie } from "cookies-next";
import { REDIRECT_URL_COOKIE_NAME } from "@/constants/auth";
import { ROUTES } from "@/constants/config";
import { resolvePostAuthPath } from "@/lib/auth/resolvePostAuthPath";

describe("resolvePostAuthPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the user to a safe redirect saved before login", () => {
    vi.mocked(getCookie).mockReturnValue("/recordings");

    expect(resolvePostAuthPath()).toBe("/recordings");
    expect(deleteCookie).toHaveBeenCalledWith(REDIRECT_URL_COOKIE_NAME);
  });

  it("ignores an unsafe redirect and opens capture", () => {
    vi.mocked(getCookie).mockReturnValue("//evil.com");

    expect(resolvePostAuthPath()).toBe(ROUTES.capture);
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it("opens capture when login had no saved redirect", () => {
    vi.mocked(getCookie).mockReturnValue(undefined);

    expect(resolvePostAuthPath()).toBe(ROUTES.capture);
    expect(deleteCookie).not.toHaveBeenCalled();
  });
});
