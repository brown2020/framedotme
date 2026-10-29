import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SCREEN_CAPTURE_TIMEOUT_MESSAGE,
  SCREEN_CAPTURE_TIMEOUT_MS,
  withScreenCaptureTimeout,
} from "@/lib/screenCaptureTimeout";
import { useRecorderStatusStore } from "@/zustand/useRecorderStatusStore";

afterEach(() => {
  vi.useRealTimers();
  useRecorderStatusStore.setState({
    recorderStatus: "idle",
    statusMessage: null,
    localUpdatedAt: 0,
    lastError: null,
    isUpdatingFromFirestore: false,
  });
});

describe("withScreenCaptureTimeout", () => {
  it("rejects a screen picker that never appears", async () => {
    vi.useFakeTimers();
    const pending = withScreenCaptureTimeout(new Promise<MediaStream>(() => {}));
    const expectation = expect(pending).rejects.toThrow(SCREEN_CAPTURE_TIMEOUT_MESSAGE);
    await vi.advanceTimersByTimeAsync(SCREEN_CAPTURE_TIMEOUT_MS);
    await expectation;
  });

  it("returns the stream when capture settles first", async () => {
    vi.useFakeTimers();
    const stream = { id: "screen" } as unknown as MediaStream;
    await expect(withScreenCaptureTimeout(Promise.resolve(stream))).resolves.toBe(stream);
    await vi.advanceTimersByTimeAsync(SCREEN_CAPTURE_TIMEOUT_MS);
  });
});

describe("recorder status shared with /capture", () => {
  it("keeps an error when an older idle snapshot arrives", () => {
    const updatedAt = useRecorderStatusStore.getState().reportFailure(SCREEN_CAPTURE_TIMEOUT_MESSAGE);
    useRecorderStatusStore.getState().applyRemoteRecorderStatus({
      status: "idle",
      message: null,
      updatedAt: updatedAt - 1,
    });
    expect(useRecorderStatusStore.getState().recorderStatus).toBe("error");
    expect(useRecorderStatusStore.getState().statusMessage).toBe(SCREEN_CAPTURE_TIMEOUT_MESSAGE);
  });

  it("applies a starting status published from the popup", () => {
    useRecorderStatusStore.getState().applyRemoteRecorderStatus({
      status: "starting",
      message: null,
      updatedAt: 10,
    });
    expect(useRecorderStatusStore.getState().recorderStatus).toBe("starting");

    useRecorderStatusStore.getState().applyRemoteRecorderStatus({
      status: "error",
      message: SCREEN_CAPTURE_TIMEOUT_MESSAGE,
      updatedAt: 20,
    });
    expect(useRecorderStatusStore.getState().recorderStatus).toBe("error");
    expect(useRecorderStatusStore.getState().statusMessage).toBe(SCREEN_CAPTURE_TIMEOUT_MESSAGE);
  });
});
