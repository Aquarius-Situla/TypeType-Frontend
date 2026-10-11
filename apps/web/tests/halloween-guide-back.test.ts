import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { WALK } from "../src/halloween/corridor/corridor-config";
import { FIRST_DOOR, peekSpot } from "../src/halloween/corridor/corridor-story";
import { END_DISTANCE } from "../src/halloween/corridor/descent-frame";
import { GUIDE, guideWanted, steer } from "../src/halloween/corridor/guide-back";
import { createWalker, stepWalker } from "../src/halloween/corridor/walker";

const spot = peekSpot(FIRST_DOOR, "left");

describe("walked back to the watcher's door", () => {
  test("only when the walker hits the end wall before seeing the watcher", () => {
    const wall = END_DISTANCE - WALK.wallMargin;
    expect(guideWanted(wall, false)).toBe(true);
    expect(guideWanted(wall, true)).toBe(false);
    expect(guideWanted(wall - 200, false)).toBe(false);
    expect(guideWanted(END_DISTANCE + 300, false)).toBe(false);
  });

  test("turns round, walks back and settles facing the gap", () => {
    let walker = { ...createWalker(), distance: END_DISTANCE - WALK.wallMargin };
    let look = { yaw: 0, pitch: 0.3 };
    let settling = false;
    for (let i = 0; i < 60 * 30; i += 1) {
      const steered = steer(walker, look, spot, settling, 1 / 60);
      settling = steered.settling;
      look = steered.look;
      walker = stepWalker(walker, steered.input, look, 1 / 60, () => true).walker;
    }
    expect(settling).toBe(true);
    expect(Math.hypot(walker.x - spot.x, walker.distance - spot.distance)).toBeLessThan(
      GUIDE.settleWithin + 40,
    );
    expect(look.yaw).toBeCloseTo(spot.yaw, 2);
    expect(look.pitch).toBeCloseTo(spot.pitch, 2);
  });

  test("keeps the words exactly as written", () => {
    for (const locale of ["en", "fr", "de", "zh-Hans-CN"]) {
      const file = new URL(`../messages/${locale}.json`, import.meta.url);
      const catalog: unknown = JSON.parse(readFileSync(file, "utf8"));
      expect(Reflect.get(Object(catalog), "halloween_guide_subtitle")).toBe(
        "I spend too much time on this freaking thing",
      );
    }
  });
});
