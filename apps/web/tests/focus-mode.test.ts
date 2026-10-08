import { describe, expect, it } from "bun:test";
import {
  getEntertainmentWeight,
  isEntertainmentVideoOld,
  shouldFilterEntertainment,
  useFocusModeStore,
} from "../src/stores/focus-mode-store";

describe("Focus Mode Store & Logic", () => {
  it("computes entertainment weight correctly across transition timeline", () => {
    // When disabled, weight is always 1.0
    expect(
      getEntertainmentWeight({
        enabled: false,
        startedAt: Date.now() - 100 * 86_400_000,
        transitionDays: 30,
      }),
    ).toBe(1.0);

    // Day 0: 100% weight
    expect(
      getEntertainmentWeight({
        enabled: true,
        startedAt: Date.now(),
        transitionDays: 100,
      }),
    ).toBeCloseTo(1.0, 2);

    // Day 50 out of 100: 50% weight
    expect(
      getEntertainmentWeight({
        enabled: true,
        startedAt: Date.now() - 50 * 86_400_000,
        transitionDays: 100,
      }),
    ).toBeCloseTo(0.5, 2);

    // Day 100+ out of 100: 0% weight (completely filtered out)
    expect(
      getEntertainmentWeight({
        enabled: true,
        startedAt: Date.now() - 120 * 86_400_000,
        transitionDays: 100,
      }),
    ).toBe(0.0);
  });

  it("filters entertainment deterministically based on hash", () => {
    const stateHalfway = {
      enabled: true,
      startedAt: Date.now() - 50 * 86_400_000,
      transitionDays: 100,
    };

    const res1 = shouldFilterEntertainment(stateHalfway, "video_123");
    const res2 = shouldFilterEntertainment(stateHalfway, "video_123");
    expect(res1).toBe(res2); // Pure and deterministic

    // Fully decayed state filters everything
    const stateFinished = {
      enabled: true,
      startedAt: Date.now() - 101 * 86_400_000,
      transitionDays: 100,
    };
    expect(shouldFilterEntertainment(stateFinished, "any_video")).toBe(true);
  });

  it("checks whether entertainment video is older than cutoff window", () => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 86_400_000;
    const tenDaysAgo = now - 10 * 86_400_000;

    expect(isEntertainmentVideoOld(threeDaysAgo, 7)).toBe(false);
    expect(isEntertainmentVideoOld(tenDaysAgo, 7)).toBe(true);
    expect(isEntertainmentVideoOld(0, 7)).toBe(false);
  });

  it("updates focus mode store state and settings", () => {
    const store = useFocusModeStore.getState();
    store.setEnabled(true);
    expect(useFocusModeStore.getState().enabled).toBe(true);

    store.setTransitionDays(60);
    expect(useFocusModeStore.getState().transitionDays).toBe(60);

    store.setHideOldEntertainmentDays(14);
    expect(useFocusModeStore.getState().hideOldEntertainmentDays).toBe(14);

    store.setStudyGroupId("group_study");
    store.setEntertainmentGroupId("group_fun");
    expect(useFocusModeStore.getState().studyGroupId).toBe("group_study");
    expect(useFocusModeStore.getState().entertainmentGroupId).toBe("group_fun");

    store.setEnabled(false);
    expect(useFocusModeStore.getState().enabled).toBe(false);
  });
});
