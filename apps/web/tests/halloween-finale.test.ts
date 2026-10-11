import { describe, expect, test } from "bun:test";
import { FINALE, finaleFrame, nearestTurn } from "../src/halloween/corridor/finale";

describe("finale", () => {
  test("nothing happens before the walker reaches the deck", () => {
    expect(finaleFrame(null)).toBeNull();
  });

  test("the face emerges from the snow before the snow clears", () => {
    expect(finaleFrame(0)).toMatchObject({ snow: 1, face: 0 });
    expect(finaleFrame(FINALE.face[1])).toMatchObject({ face: 1, recentre: 1 });
    expect(finaleFrame((FINALE.face[0] + FINALE.face[1]) / 2)?.snow).toBeGreaterThan(0.9);
    expect(finaleFrame(FINALE.face[1])?.snow).toBeGreaterThan(0);
    expect(finaleFrame(FINALE.snowOut[1])?.snow).toBe(0);
  });

  test("the view closes in slowly, all through the scene", () => {
    const quarter = finaleFrame(FINALE.zoom[0] + (FINALE.zoom[1] - FINALE.zoom[0]) / 4)?.zoom ?? 0;
    expect(quarter).toBeGreaterThan(0);
    expect(quarter).toBeLessThan(0.25);
    expect(finaleFrame(FINALE.zoom[1])?.zoom).toBe(1);
  });

  test("turning to the screen takes the short way round", () => {
    expect(nearestTurn(Math.PI / 2 + Math.PI * 4 + 0.2, Math.PI / 2)).toBeCloseTo(
      Math.PI / 2 + Math.PI * 4,
    );
    expect(nearestTurn(-Math.PI / 2, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });
});
