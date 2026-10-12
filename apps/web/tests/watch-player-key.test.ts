import { describe, expect, test } from "bun:test";
import { buildWatchPlayerKey } from "../src/lib/watch-player-key";

describe("buildWatchPlayerKey", () => {
  test("tracks manifest-affecting inputs", () => {
    const base = {
      streamId: "video",
      retryKey: 0,
      sourceKey: "manifest",
      highQuality: false,
      hasThumbnails: false,
      hasChapters: false,
    };

    expect(buildWatchPlayerKey(base)).not.toBe(
      buildWatchPlayerKey({ ...base, hasThumbnails: true }),
    );
  });

  test("ignores metadata that does not change a sabr source", () => {
    const base = {
      streamId: "video",
      retryKey: 0,
      sourceKey: "sabr:unknown",
      highQuality: false,
      hasThumbnails: false,
      hasChapters: false,
    };

    expect(
      buildWatchPlayerKey({
        ...base,
        highQuality: true,
        hasThumbnails: true,
        hasChapters: true,
      }),
    ).toBe(buildWatchPlayerKey(base));
  });

  test("ignores the unused direct manifest identity for sabr", () => {
    const base = {
      streamId: "video",
      retryKey: 0,
      sourceKey: "sabr:manifest-a",
      highQuality: true,
      hasThumbnails: true,
      hasChapters: true,
    };

    expect(buildWatchPlayerKey({ ...base, sourceKey: "sabr:manifest-b" })).toBe(
      buildWatchPlayerKey(base),
    );
  });

  test("can keep a sabr media element stable across engine retries", () => {
    const base = {
      streamId: "video",
      retryKey: 0,
      sourceKey: "sabr:manifest",
      highQuality: true,
      hasThumbnails: true,
      hasChapters: true,
    };

    expect(buildWatchPlayerKey(base)).toBe(buildWatchPlayerKey({ ...base, retryKey: 4 }));
  });
});
