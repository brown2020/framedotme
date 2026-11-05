import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  analyticsInstance,
  app,
  getAnalytics,
  getCookieConsentValue,
  initializeAnalytics,
  isSupported,
  logEvent,
} = vi.hoisted(() => {
  const analyticsInstance = { name: "analytics" };
  const app = {
    name: "[DEFAULT]",
    options: { measurementId: "G-05J2ZR9XHQ" },
  };
  return {
    analyticsInstance,
    app,
    getAnalytics: vi.fn(() => analyticsInstance),
    getCookieConsentValue: vi.fn(),
    initializeAnalytics: vi.fn(() => analyticsInstance),
    isSupported: vi.fn(async () => true),
    logEvent: vi.fn(),
  };
});

vi.mock("firebase/analytics", () => ({
  getAnalytics,
  initializeAnalytics,
  isSupported,
  logEvent,
}));

vi.mock("@/firebase/firebaseClient", () => ({
  app,
}));

vi.mock("react-cookie-consent", () => ({
  defaultCookieConsentName: "CookieConsent",
  getCookieConsentValue,
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

async function loadAnalyticsService() {
  return import("@/services/analyticsService");
}

beforeEach(() => {
  vi.resetModules();
  getAnalytics.mockClear();
  getCookieConsentValue.mockReset();
  initializeAnalytics.mockClear();
  isSupported.mockReset();
  logEvent.mockClear();
  getAnalytics.mockReturnValue(analyticsInstance);
  initializeAnalytics.mockReturnValue(analyticsInstance);
  isSupported.mockResolvedValue(true);
  getCookieConsentValue.mockReturnValue(undefined);
  vi.stubGlobal("document", { title: "Frame.me" });
  vi.stubGlobal("window", { location: { origin: "https://frame.me" } });
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENTID", "G-05J2ZR9XHQ");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("firebase analytics", () => {
  it("does not initialize before cookie consent", async () => {
    const { trackPageView } = await loadAnalyticsService();

    await trackPageView("/");

    expect(isSupported).not.toHaveBeenCalled();
    expect(getAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("initializes with getAnalytics after consent and logs the route", async () => {
    getCookieConsentValue.mockReturnValue("true");
    const { trackPageView } = await loadAnalyticsService();

    await trackPageView("/recordings");
    await trackPageView("/recordings");

    expect(isSupported).toHaveBeenCalledTimes(1);
    expect(initializeAnalytics).toHaveBeenCalledWith(app, {
      config: { send_page_view: false },
    });
    expect(getAnalytics).toHaveBeenCalledTimes(1);
    expect(getAnalytics).toHaveBeenCalledWith(app);
    expect(isSupported.mock.invocationCallOrder[0]).toBeLessThan(
      initializeAnalytics.mock.invocationCallOrder[0] ?? 0,
    );
    expect(initializeAnalytics.mock.invocationCallOrder[0]).toBeLessThan(
      getAnalytics.mock.invocationCallOrder[0] ?? 0,
    );
    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(logEvent).toHaveBeenCalledWith(analyticsInstance, "page_view", {
      page_path: "/recordings",
      page_location: "https://frame.me/recordings",
      page_title: "Frame.me",
    });
  });

  it("logs page_view again when the client route changes", async () => {
    getCookieConsentValue.mockReturnValue("true");
    const { trackPageView } = await loadAnalyticsService();

    await trackPageView("/");
    await trackPageView("/support");

    expect(getAnalytics).toHaveBeenCalledTimes(1);
    expect(logEvent).toHaveBeenNthCalledWith(2, analyticsInstance, "page_view", {
      page_path: "/support",
      page_location: "https://frame.me/support",
      page_title: "Frame.me",
    });
  });

  it("does not call getAnalytics when the measurement ID is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENTID", "");
    getCookieConsentValue.mockReturnValue("true");
    const { trackPageView } = await loadAnalyticsService();

    await trackPageView("/");

    expect(isSupported).not.toHaveBeenCalled();
    expect(getAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("does not call getAnalytics when the browser cannot support analytics", async () => {
    isSupported.mockResolvedValue(false);
    getCookieConsentValue.mockReturnValue("true");
    const { trackPageView } = await loadAnalyticsService();

    await trackPageView("/");

    expect(initializeAnalytics).not.toHaveBeenCalled();
    expect(getAnalytics).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("drops a page view cancelled before analytics resolves", async () => {
    let resolveSupported: (supported: boolean) => void = () => {};
    const supported = new Promise<boolean>((resolve) => {
      resolveSupported = resolve;
    });
    isSupported.mockImplementation(() => supported);
    getCookieConsentValue.mockReturnValue("true");
    const { trackPageView } = await loadAnalyticsService();
    let cancelled = false;

    const pending = trackPageView("/capture", () => cancelled);
    cancelled = true;
    resolveSupported(true);
    await pending;

    expect(logEvent).not.toHaveBeenCalled();
  });

  it("tracks the current page when accept notifies subscribers", async () => {
    const { hasAnalyticsConsent, notifyAnalyticsConsent, subscribeToAnalyticsConsent } =
      await loadAnalyticsService();
    const listener = vi.fn();
    const unsubscribe = subscribeToAnalyticsConsent(listener);

    expect(hasAnalyticsConsent()).toBe(false);
    getCookieConsentValue.mockReturnValue("true");
    notifyAnalyticsConsent();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(hasAnalyticsConsent()).toBe(true);
    unsubscribe();
    notifyAnalyticsConsent();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
