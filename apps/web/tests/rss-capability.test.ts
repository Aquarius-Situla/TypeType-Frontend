import { describe, expect, test } from "bun:test";

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
}

const { normalizeInstanceCapabilities } = await import("../src/lib/api-instance");

const recommender = { installed: false, enabled: false, experimental: true };

describe("RSS instance capability", () => {
  test("keeps RSS hidden when an older Server omits the capability", () => {
    expect(normalizeInstanceCapabilities({ guestAllowed: true })).toEqual({
      guestAllowed: true,
      parentalControlsEnabled: false,
      rss: {
        enabled: false,
        maxFeedsPerUser: 0,
        maxItems: 0,
        minimumPollMinutes: 0,
        rateLimitPerMinute: 0,
      },
      recommender,
      twitch: { enabled: false },
    });
  });

  test("retains a complete RSS capability", () => {
    const rss = {
      enabled: true,
      maxFeedsPerUser: 8,
      maxItems: 60,
      minimumPollMinutes: 10,
      rateLimitPerMinute: 4,
    };
    expect(
      normalizeInstanceCapabilities({
        guestAllowed: false,
        parentalControlsEnabled: true,
        rss,
      }),
    ).toEqual({
      guestAllowed: false,
      parentalControlsEnabled: true,
      rss,
      recommender,
      twitch: { enabled: false },
    });
  });

  test("reads the Twitch capability and keeps it off when absent or malformed", () => {
    expect(
      normalizeInstanceCapabilities({ guestAllowed: true, twitch: { enabled: true } })?.twitch,
    ).toEqual({
      enabled: true,
    });
    expect(
      normalizeInstanceCapabilities({ guestAllowed: true, twitch: { enabled: "yes" } })?.twitch,
    ).toEqual({
      enabled: false,
    });
  });

  test("rejects an invalid base payload", () => {
    expect(normalizeInstanceCapabilities(null)).toBeNull();
    expect(normalizeInstanceCapabilities({ guestAllowed: "yes" })).toBeNull();
  });
});
