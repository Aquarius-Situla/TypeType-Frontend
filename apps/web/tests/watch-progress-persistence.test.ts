import { describe, expect, it } from "bun:test";
import {
  evaluateProgressPersistence,
  reconcileProgressItem,
  type SaveReason,
} from "../src/lib/watch-resume";
import type { ProgressItem } from "../src/types/user";

describe("evaluateProgressPersistence", () => {
  const durationMs = 600_000;
  const evalAt = (
    positionMs: number,
    lastSavedPositionMs = 0,
    maxPositionSeenMs = positionMs,
    reason: SaveReason = "interval",
  ) =>
    evaluateProgressPersistence({
      positionMs,
      lastSavedPositionMs,
      maxPositionSeenMs,
      durationMs,
      reason,
    });

  it("rejects non-finite and non-positive positions", () => {
    expect(evalAt(Number.NaN)).toEqual({ shouldSave: false });
    expect(evalAt(0)).toEqual({ shouldSave: false });
    expect(evalAt(-100)).toEqual({ shouldSave: false });
  });

  it("resets progress to 0 when seeking back to the start after watching", () => {
    expect(evalAt(2_000, 30_000, 30_000, "seeked")).toEqual({
      shouldSave: true,
      positionMs: 0,
      keepalive: false,
      isReset: true,
      isBackwardJump: false,
    });
  });

  it("rejects positions too close to completion (>= 95% duration)", () => {
    expect(evalAt(575_000, 500_000, 575_000, "interval")).toEqual({ shouldSave: false });
  });

  it("persists normal forward progression", () => {
    expect(evalAt(15_000, 10_000, 15_000, "interval")).toEqual({
      shouldSave: true,
      positionMs: 15_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: false,
    });
  });

  it("detects backward jump (> 3s) and persists it for review/re-study", () => {
    expect(evalAt(40_000, 60_000, 60_000, "interval")).toEqual({
      shouldSave: true,
      positionMs: 40_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: true,
    });
  });

  it("ignores minor backward jitter (<= 3s) during interval ticks", () => {
    expect(evalAt(58_000, 60_000, 60_000, "interval")).toEqual({ shouldSave: false });
  });

  it("allows explicit seeked event even if backward within 3s", () => {
    expect(evalAt(58_000, 60_000, 60_000, "seeked")).toEqual({
      shouldSave: true,
      positionMs: 58_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: false,
    });
  });

  it("flags keepalive for tab unload and visibility hiding", () => {
    for (const reason of ["pagehide", "beforeunload", "visibility"] as const) {
      expect(evalAt(30_000, 25_000, 30_000, reason)).toMatchObject({
        shouldSave: true,
        keepalive: true,
      });
    }
  });
});

describe("reconcileProgressItem", () => {
  const url = "https://example.com/watch?v=123";

  it("handles empty states safely", () => {
    const res = reconcileProgressItem(null, null);
    expect(res.chosen).toEqual({ videoUrl: "", position: 0, updatedAt: 0 });
    expect(res.shouldSyncServer).toBe(false);
    expect(res.shouldSyncLocal).toBe(false);
  });

  it("prefers local progress when server record is absent", () => {
    const local: ProgressItem = { videoUrl: url, position: 45, updatedAt: 1000 };
    const res = reconcileProgressItem(local, null);
    expect(res.chosen).toBe(local);
    expect(res.shouldSyncServer).toBe(false);
    expect(res.shouldSyncLocal).toBe(false);
  });

  it("prefers server progress when local record is absent", () => {
    const server: ProgressItem = { videoUrl: url, position: 90, updatedAt: 2000 };
    const res = reconcileProgressItem(null, server);
    expect(res.chosen).toBe(server);
    expect(res.shouldSyncServer).toBe(false);
    expect(res.shouldSyncLocal).toBe(true);
  });

  it("prefers local progress and syncs to server if local is strictly newer", () => {
    const local: ProgressItem = { videoUrl: url, position: 120, updatedAt: 5000 };
    const server: ProgressItem = { videoUrl: url, position: 30, updatedAt: 4000 };
    const res = reconcileProgressItem(local, server);
    expect(res.chosen).toBe(local);
    expect(res.shouldSyncServer).toBe(true);
    expect(res.shouldSyncLocal).toBe(false);
  });

  it("prefers server progress and updates local cache if server is newer", () => {
    const local: ProgressItem = { videoUrl: url, position: 30, updatedAt: 4000 };
    const server: ProgressItem = { videoUrl: url, position: 120, updatedAt: 5000 };
    const res = reconcileProgressItem(local, server);
    expect(res.chosen).toBe(server);
    expect(res.shouldSyncServer).toBe(false);
    expect(res.shouldSyncLocal).toBe(true);
  });
});
