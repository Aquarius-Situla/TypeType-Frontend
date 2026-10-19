import { expect, test } from "bun:test";
import { danmakuEmoteUrl, parseDanmakuRichText } from "../src/lib/danmaku-rich-text";

test("parses known emotes inside surrounding text", () => {
  const tokens = parseDanmakuRichText("太强了[doge]");
  expect(tokens).toEqual([
    { type: "text", text: "太强了", start: 0 },
    { type: "emote", code: "[doge]", src: danmakuEmoteUrl("[doge]") ?? "", start: 3 },
  ]);
});

test("keeps unknown bracketed codes as plain text", () => {
  expect(parseDanmakuRichText("[not-an-emote] hello")).toEqual([
    { type: "text", text: "[not-an-emote] hello", start: 0 },
  ]);
});

test("does not treat timestamps as emotes", () => {
  expect(parseDanmakuRichText("[01:23] look")).toEqual([
    { type: "text", text: "[01:23] look", start: 0 },
  ]);
});

test("parses several emotes in one comment", () => {
  const tokens = parseDanmakuRichText("[doge] et [妙啊]");
  expect(tokens.map((token) => token.type)).toEqual(["emote", "text", "emote"]);
});
