import { describe, expect, it } from "bun:test";
import { evaluateProgressPersistence, reconcileProgressItem } from "../src/lib/watch-resume";
import type { ProgressItem } from "../src/types/user";

describe("evaluateProgressPersistence", () => {
  const durationMs = 600_000; // 10 minutes

  it("rejects non-finite and non-positive positions", () => {
    expect(
      evaluateProgressPersistence({
        positionMs: Number.NaN,
        lastSavedPositionMs: 0,
        maxPositionSeenMs: 0,
        durationMs,
        reason: "interval",
      }),
    ).toEqual({ shouldSave: false });

    expect(
      evaluateProgressPersistence({
        positionMs: 0,
        lastSavedPositionMs: 0,
        maxPositionSeenMs: 0,
        durationMs,
        reason: "interval",
      }),
    ).toEqual({ shouldSave: false });

    expect(
      evaluateProgressPersistence({
        positionMs: -100,
        lastSavedPositionMs: 0,
        maxPositionSeenMs: 0,
        durationMs,
        reason: "interval",
      }),
    ).toEqual({ shouldSave: false });
  });

  it("resets progress to 0 when seeking back to the start after watching", () => {
    const decision = evaluateProgressPersistence({
      positionMs: 2_000,
      lastSavedPositionMs: 30_000,
      maxPositionSeenMs: 30_000,
      durationMs,
      reason: "seeked",
    });

    expect(decision).toEqual({
      shouldSave: true,
      positionMs: 0,
      keepalive: false,
      isReset: true,
      isBackwardJump: false,
    });
  });

  it("rejects positions too close to completion (>= 95% duration)", () => {
    expect(
      evaluateProgressPersistence({
        positionMs: 575_000, // 95.8%
        lastSavedPositionMs: 500_000,
        maxPositionSeenMs: 575_000,
        durationMs,
        reason: "interval",
      }),
    ).toEqual({ shouldSave: false });
  });

  it("persists normal forward progression", () => {
    const decision = evaluateProgressPersistence({
      positionMs: 15_000,
      lastSavedPositionMs: 10_000,
      maxPositionSeenMs: 15_000,
      durationMs,
      reason: "interval",
    });

    expect(decision).toEqual({
      shouldSave: true,
      positionMs: 15_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: false,
    });
  });

  it("detects backward jump (> 3s) and persists it for review/re-study", () => {
    const decision = evaluateProgressPersistence({
      positionMs: 40_000,
      lastSavedPositionMs: 60_000,
      maxPositionSeenMs: 60_000,
      durationMs,
      reason: "interval",
    });

    expect(decision).toEqual({
      shouldSave: true,
      positionMs: 40_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: true,
    });
  });

  it("ignores minor backward jitter (<= 3s) during interval ticks", () => {
    const decision = evaluateProgressPersistence({
      positionMs: 58_000,
      lastSavedPositionMs: 60_000,
      maxPositionSeenMs: 60_000,
      durationMs,
      reason: "interval",
    });

    expect(decision).toEqual({ shouldSave: false });
  });

  it("allows explicit seeked event even if backward within 3s", () => {
    const decision = evaluateProgressPersistence({
      positionMs: 58_000,
      lastSavedPositionMs: 60_000,
      maxPositionSeenMs: 60_000,
      durationMs,
      reason: "seeked",
    });

    expect(decision).toEqual({
      shouldSave: true,
      positionMs: 58_000,
      keepalive: false,
      isReset: false,
      isBackwardJump: false,
    });
  });

  it("flags keepalive for tab unload and visibility hiding", () => {
    const pagehideDecision = evaluateProgressPersistence({
      positionMs: 30_000,
      lastSavedPositionMs: 25_000,
      maxPositionSeenMs: 30_000,
      durationMs,
      reason: "pagehide",
    });
    expect(pagehideDecision).toMatchObject({
      shouldSave: true,
      keepalive: true,
    });

    const beforeunloadDecision = evaluateProgressPersistence({
      positionMs: 30_000,
      lastSavedPositionMs: 25_000,
      maxPositionSeenMs: 30_000,
      durationMs,
      reason: "beforeunload",
    });
    expect(beforeunloadDecision).toMatchObject({
      shouldSave: true,
      keepalive: true,
    });

    const visibilityDecision = evaluateProgressPersistence({
      positionMs: 30_000,
      lastSavedPositionMs: 25_000,
      maxPositionSeenMs: 30_000,
      durationMs,
      reason: "visibility",
    });
    expect(visibilityDecision).toMatchObject({
      shouldSave: true,
      keepalive: true,
    });
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
