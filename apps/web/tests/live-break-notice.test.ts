import { expect, test } from "bun:test";
import type { LevelUpdatedData } from "hls.js";
import { breakEnd } from "../src/hooks/use-live-break-notice";

const level = (ranges: Record<string, { class: string; endDate: Date | null }>) =>
  ({ details: { dateRanges: ranges } }) as unknown as LevelUpdatedData;

test("the announced break ends with its latest range still ahead", () => {
  const now = Date.parse("2026-11-17T22:00:10Z");
  const end = breakEnd(
    level({
      a: { class: "com.typetype.ad-break", endDate: new Date("2026-11-17T22:00:40Z") },
      b: { class: "com.typetype.ad-break", endDate: new Date("2026-11-17T22:00:55Z") },
      old: { class: "com.typetype.ad-break", endDate: new Date("2026-11-17T21:59:00Z") },
      other: { class: "twitch-trigger", endDate: new Date("2026-11-17T23:00:00Z") },
    }),
    now,
  );
  expect(end).toBe(Date.parse("2026-11-17T22:00:55Z"));
});

test("no break once its ranges are past or gone", () => {
  const now = Date.parse("2026-11-17T22:01:00Z");
  expect(
    breakEnd(
      level({ a: { class: "com.typetype.ad-break", endDate: new Date("2026-11-17T22:00:55Z") } }),
      now,
    ),
  ).toBeNull();
  expect(breakEnd(level({}), now)).toBeNull();
});
