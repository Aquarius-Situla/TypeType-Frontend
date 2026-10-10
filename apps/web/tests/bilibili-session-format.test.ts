import { describe, expect, test } from "bun:test";
import {
  bilibiliSessionDaysLeft,
  formatBilibiliSessionTime,
  toBilibiliSessionTimeMs,
} from "../src/lib/bilibili-session-format";

describe("formatBilibiliSessionTime", () => {
  test("returns placeholder for undefined or 0", () => {
    expect(formatBilibiliSessionTime(undefined)).toBe("—");
    expect(formatBilibiliSessionTime(0)).toBe("—");
  });

  test("handles millisecond timestamps without year 58801 overflow", () => {
    // 1793697616000 is 2026-11-03T09:20:16.000Z
    const formatted = formatBilibiliSessionTime(1793697616000);
    expect(formatted).toContain("2026");
    expect(formatted).not.toContain("58801");
  });

  test("handles second epoch timestamps correctly", () => {
    // 1793697616 is 2026-11-03T09:20:16.000Z
    const formatted = formatBilibiliSessionTime(1793697616);
    expect(formatted).toContain("2026");
    expect(formatted).not.toContain("58801");
  });
});

describe("toBilibiliSessionTimeMs", () => {
  test("returns milliseconds for both second and millisecond inputs", () => {
    expect(toBilibiliSessionTimeMs(1793697616)).toBe(1793697616000);
    expect(toBilibiliSessionTimeMs(1793697616000)).toBe(1793697616000);
  });

  test("returns null for missing or zero timestamps", () => {
    expect(toBilibiliSessionTimeMs(undefined)).toBeNull();
    expect(toBilibiliSessionTimeMs(0)).toBeNull();
  });
});

describe("bilibiliSessionDaysLeft", () => {
  const now = Date.UTC(2026, 10, 3, 9, 20, 16);

  test("counts the same number of days whatever the timestamp unit is", () => {
    const inThreeDays = now + 3 * 86400000;
    expect(bilibiliSessionDaysLeft(inThreeDays, now)).toBe(3);
    expect(bilibiliSessionDaysLeft(Math.floor(inThreeDays / 1000), now)).toBe(3);
  });

  test("returns 0 without an expiry and stays negative once expired", () => {
    expect(bilibiliSessionDaysLeft(undefined, now)).toBe(0);
    expect(bilibiliSessionDaysLeft(now - 86400000, now)).toBe(-1);
  });
});
