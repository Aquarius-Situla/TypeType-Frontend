import { describe, expect, test } from "bun:test";
import { formatBilibiliSessionTime } from "../src/lib/bilibili-session-format";

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
