import { describe, expect, test } from "bun:test";
import {
  STICK_BUG,
  STICK_BUG_RICKROLL,
  STICK_FACE,
  type Stick,
} from "../src/halloween/corridor/stick-drawings";
import { CLIP_FADE, MEME, memeFrame, STICK_COUNT } from "../src/halloween/corridor/stick-show";

const centre = (s: Stick | undefined): [number, number] =>
  s ? [(s[0] + s[2]) / 2, (s[1] + s[3]) / 2] : [0, 0];
const length = (s: Stick | undefined): number => (s ? Math.hypot(s[2] - s[0], s[3] - s[1]) : 0);

describe("stick show", () => {
  test("the face stays alone until the sticks start drawing themselves on it, one by one", () => {
    expect(memeFrame(MEME.sticksIn[0] - 1)).toMatchObject({ face: 1, sticks: [], track: null });
    const early = memeFrame(MEME.sticksIn[0] + 600).sticks.filter((s) => s.opacity > 0);
    expect(early.length).toBeGreaterThan(0);
    expect(early.length).toBeLessThan(STICK_COUNT);
  });

  test("once drawn, every stick lies on a feature of the face", () => {
    const all = memeFrame(MEME.faceOut[0] - 20);
    expect(all.face).toBe(1);
    all.sticks.forEach((s, i) => {
      expect(centre(s.shape)[0]).toBeCloseTo(centre(STICK_FACE[i % STICK_FACE.length])[0], 5);
    });
  });

  test("the bug's sound starts with the face going, and the sticks reach the clip's own bug before it shows", () => {
    expect(memeFrame(MEME.stickbug.start).track).toEqual({ name: "stickbug", since: 0 });
    expect(MEME.toBug[1]).toBeLessThan(MEME.stickbug.start + CLIP_FADE.stickbug[0]);
    const bug = memeFrame(MEME.toBug[1] + 50);
    expect(centre(bug.sticks[0]?.shape)[0]).toBeCloseTo(centre(STICK_BUG[0])[0], 5);
    expect(length(bug.sticks[0]?.shape)).toBeCloseTo(length(STICK_BUG[0]), 5);
  });

  test("a dead stop between the two clips, then the sticks stand where the stick-rolled clip opens", () => {
    const stop = MEME.stickbug.start + MEME.stickbug.length + 300;
    expect(stop).toBeLessThan(MEME.rickroll.start);
    expect(memeFrame(stop)).toMatchObject({ sticks: [], track: null });
    const rick = memeFrame(MEME.rickroll.start + 10);
    expect(rick.track).toEqual({ name: "rickroll", since: 10 });
    expect(rick.sticks[2]?.shape).toEqual(STICK_BUG_RICKROLL[2]);
    expect(memeFrame(MEME.rickroll.start + MEME.rickroll.length + 10)).toMatchObject({
      sticks: [],
      track: null,
    });
  });
});
