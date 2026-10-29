import { describe, expect, it } from "vitest";
import {
  RECORDER_POPUP_BLOCKED,
  RECORDER_POPUP_CLOSED,
  RECORDER_SHARE_ENDED,
  remoteUpdatedAtMillis,
  shouldApplyRemoteStatus,
} from "@/lib/recorderStatusTime";

describe("shouldApplyRemoteStatus", () => {
  it("keeps a local error ahead of an older idle snapshot", () => {
    expect(shouldApplyRemoteStatus(2_000, 1_000)).toBe(false);
    expect(shouldApplyRemoteStatus(2_000, 0)).toBe(false);
    expect(shouldApplyRemoteStatus(0, 1_000)).toBe(true);
    expect(shouldApplyRemoteStatus(2_000, 2_000)).toBe(true);
    expect(shouldApplyRemoteStatus(2_000, 3_000)).toBe(true);
  });
});

describe("remoteUpdatedAtMillis", () => {
  it("reads numbers, dates, and Firestore timestamps", () => {
    expect(remoteUpdatedAtMillis(50)).toBe(50);
    expect(remoteUpdatedAtMillis(new Date(80))).toBe(80);
    expect(remoteUpdatedAtMillis({ toMillis: () => 90 })).toBe(90);
    expect(remoteUpdatedAtMillis(undefined)).toBe(0);
  });
});

describe("recorder failure copy", () => {
  it("explains a blocked popup, a closed popup, and a share that ended", () => {
    expect(RECORDER_POPUP_BLOCKED).toMatch(/blocked/);
    expect(RECORDER_POPUP_CLOSED).toMatch(/closed/);
    expect(RECORDER_SHARE_ENDED).toMatch(/Initialize Recording/);
  });
});
