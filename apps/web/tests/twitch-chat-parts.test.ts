import { describe, expect, test } from "bun:test";
import { chatNameColor } from "../src/lib/twitch-chat-color";
import { chatParts, linkHref, mentions } from "../src/lib/twitch-chat-parts";
import type { TwitchThirdPartyEmote } from "../src/types/twitch";

const emote = (name: string, zeroWidth = false): TwitchThirdPartyEmote => ({
  name,
  url: `https://cdn.7tv.app/emote/${name}/1x.webp`,
  provider: "7tv",
  zeroWidth,
});

const map = new Map([
  ["catJAM", emote("catJAM")],
  ["RainTime", emote("RainTime", true)],
]);

describe("chatParts", () => {
  test("keeps native emote ranges with code points", () => {
    const parts = chatParts("😀 Kappa hi", [{ id: "25", start: 2, end: 6 }]);
    expect(parts[0]).toEqual({ kind: "text", text: "😀 " });
    expect(parts[1]).toMatchObject({ kind: "emote", emote: { name: "Kappa" } });
    expect(parts[2]).toEqual({ kind: "text", text: " hi" });
  });

  test("replaces third party emote words and stacks zero width ones", () => {
    const parts = chatParts("hey catJAM RainTime ok", [], map);
    expect(parts).toHaveLength(3);
    expect(parts[1]).toMatchObject({ kind: "emote", emote: { name: "catJAM" } });
    expect(parts[1]).toHaveProperty("overlays.0.name", "RainTime");
    expect(parts[2]).toEqual({ kind: "text", text: " ok" });
  });

  test("a zero width emote alone is a normal emote", () => {
    expect(chatParts("RainTime", [], map)[0]).toMatchObject({ kind: "emote", overlays: [] });
  });

  test("detects links without trailing punctuation", () => {
    const parts = chatParts("look at example.com/a?b=1, now", [], map);
    expect(parts[1]).toEqual({
      kind: "link",
      text: "example.com/a?b=1",
      href: "https://example.com/a?b=1",
    });
    expect(parts[2]).toEqual({ kind: "text", text: ", now" });
  });

  test("detects mentions of the viewer", () => {
    const parts = chatParts("@Viewer: hi @other", [], map, "viewer");
    expect(parts[0]).toEqual({ kind: "mention", text: "@Viewer", self: true });
    expect(mentions(parts)).toBe(true);
    expect(mentions(chatParts("@other", [], map, "viewer"))).toBe(false);
  });
});

describe("linkHref", () => {
  test("accepts web links only", () => {
    expect(linkHref("https://twitch.tv/x")).toBe("https://twitch.tv/x");
    expect(linkHref("javascript:alert(1)")).toBeNull();
    expect(linkHref("lol.")).toBeNull();
    expect(linkHref("file.txt")).toBeNull();
    expect(linkHref("www.example.zip")).toBe("https://www.example.zip/");
    expect(linkHref("typetype.video")).toBe("https://typetype.video/");
  });
});

describe("chatNameColor", () => {
  test("keeps readable colors and lifts dark ones on a dark theme", () => {
    expect(chatNameColor("#1E90FF", "a", "dark")).toBe("rgb(30, 144, 255)");
    expect(chatNameColor("#0000FF", "a", "dark")).not.toBe("rgb(0, 0, 255)");
    expect(chatNameColor("#FFFF00", "a", "light")).not.toBe("rgb(255, 255, 0)");
  });

  test("gives users without a color a stable default", () => {
    expect(chatNameColor(undefined, "someone", "dark")).toBe(
      chatNameColor(undefined, "someone", "dark"),
    );
  });
});
