import { describe, expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import { nextVodChatFailure, vodChatBlocked } from "../src/lib/twitch-vod-chat-failure";

describe("VOD chat failures", () => {
  test("a 404 stops asking for that video only", () => {
    const failure = nextVodChatFailure(null, "v1", new ApiError("Not found", 404), 1_000);
    expect(failure.missing).toBe(true);
    expect(vodChatBlocked(failure, "v1", 10_000_000)).toBe(true);
    expect(vodChatBlocked(failure, "v2", 1_000)).toBe(false);
  });

  test("other errors wait longer each time, up to a minute", () => {
    let failure = nextVodChatFailure(null, "v1", new ApiError("Bad gateway", 502), 0);
    expect(failure.delayMs).toBe(5_000);
    expect(vodChatBlocked(failure, "v1", 4_999)).toBe(true);
    expect(vodChatBlocked(failure, "v1", 5_000)).toBe(false);
    const delays = [];
    for (let i = 0; i < 6; i++) {
      failure = nextVodChatFailure(failure, "v1", new TypeError("offline"), 0);
      delays.push(failure.delayMs);
    }
    expect(delays).toEqual([10_000, 20_000, 40_000, 60_000, 60_000, 60_000]);
  });

  test("a rate limit waits at least what the server asks", () => {
    const limited = new ApiError("Too many", 429, null, null, 30_000);
    expect(nextVodChatFailure(null, "v1", limited, 0).delayMs).toBe(30_000);
  });
});
