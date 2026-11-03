import { describe, expect, test } from "bun:test";
import {
  HOLD_FAST_FORWARD_ATTRIBUTE,
  SabrPlaybackRatePreference,
} from "../src/lib/sabr-playback-rate-preference";

function video(rate = 1, holding = false): HTMLVideoElement {
  return {
    defaultPlaybackRate: rate,
    playbackRate: rate,
    closest: (selector: string) =>
      holding && selector === `[${HOLD_FAST_FORWARD_ATTRIBUTE}]` ? ({} as Element) : null,
  } as unknown as HTMLVideoElement;
}

describe("SabrPlaybackRatePreference", () => {
  test("ignores the hold fast-forward speed", () => {
    const preference = new SabrPlaybackRatePreference(1.25);
    preference.capture(video(2, true), false);

    const next = video();
    preference.apply(next, false);

    expect(next.playbackRate).toBe(1.25);
  });

  test("uses the configured default for the first media element", () => {
    const preference = new SabrPlaybackRatePreference();
    preference.setPreferredRate(1.5);
    const element = video();

    preference.initialize(element);
    preference.apply(element, false);

    expect(element.defaultPlaybackRate).toBe(1.5);
    expect(element.playbackRate).toBe(1.5);
  });

  test("restores the user rate after a media element replacement", () => {
    const preference = new SabrPlaybackRatePreference();
    const first = video();
    preference.initialize(first);
    first.playbackRate = 4;
    preference.capture(first, false);

    const replacement = video();
    preference.initialize(replacement);
    preference.apply(replacement, false);

    expect(replacement.defaultPlaybackRate).toBe(4);
    expect(replacement.playbackRate).toBe(4);
  });

  test("keeps a manual rate ahead of the configured default after replacement", () => {
    const preference = new SabrPlaybackRatePreference(1.5);
    const first = video();
    preference.apply(first, false);
    first.playbackRate = 2;
    preference.capture(first, false);

    const replacement = video();
    preference.apply(replacement, false);

    expect(replacement.playbackRate).toBe(2);
  });

  test("ignores transient preroll and provider rate changes", () => {
    const preference = new SabrPlaybackRatePreference();
    const first = video(4);
    preference.initialize(first);
    const replacement = video(16);
    preference.capture(replacement, true);
    replacement.playbackRate = 1;
    preference.capture(replacement, true);

    preference.apply(replacement, false);

    expect(replacement.defaultPlaybackRate).toBe(4);
    expect(replacement.playbackRate).toBe(4);
  });

  test("does not write while the MSE transition is active", () => {
    const preference = new SabrPlaybackRatePreference();
    const element = video(2);
    preference.initialize(element);
    element.playbackRate = 1;

    preference.apply(element, true);

    expect(element.defaultPlaybackRate).toBe(2);
    expect(element.playbackRate).toBe(1);
  });
});
