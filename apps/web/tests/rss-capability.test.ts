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
    expect(
      normalizeInstanceCapabilities({ guestAllowed: true, youtubeRemoteLoginEnabled: false }),
    ).toEqual({
      guestAllowed: true,
      youtubeRemoteLoginEnabled: false,
      parentalControlsEnabled: false,
      rss: {
        enabled: false,
        maxFeedsPerUser: 0,
        maxItems: 0,
        minimumPollMinutes: 0,
        rateLimitPerMinute: 0,
      },
      recommender,
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
        youtubeRemoteLoginEnabled: true,
        parentalControlsEnabled: true,
        rss,
      }),
    ).toEqual({
      guestAllowed: false,
      youtubeRemoteLoginEnabled: true,
      parentalControlsEnabled: true,
      rss,
      recommender,
    });
  });

  test("rejects an invalid base payload", () => {
    expect(normalizeInstanceCapabilities(null)).toBeNull();
    expect(normalizeInstanceCapabilities({ guestAllowed: "yes" })).toBeNull();
  });
});
