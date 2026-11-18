import { expect, test } from "bun:test";
import { trimPlayedComments } from "../src/lib/twitch-vod-chat-window";
import type { TwitchVideoComment } from "../src/types/twitch";

const at = (offset: number): TwitchVideoComment => ({ id: String(offset), offset, text: "" });

test("played comments beyond the visible ones are dropped, upcoming ones are kept", () => {
  const comments = [1, 2, 3, 4, 5, 6, 7, 8].map(at);
  expect(trimPlayedComments(comments, 5, 2).map((c) => c.offset)).toEqual([4, 5, 6, 7, 8]);
});

test("nothing is dropped while fewer comments than the visible count were played", () => {
  const comments = [1, 2, 9].map(at);
  expect(trimPlayedComments(comments, 5, 2)).toBe(comments);
});
