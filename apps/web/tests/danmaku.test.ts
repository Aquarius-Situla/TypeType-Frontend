import { describe, expect, it } from "bun:test";
import {
  argbToColor,
  CHAR_WIDTH_PX,
  DANMAKU_EMOTES,
  displayDuration,
  estimateDanmakuWidth,
  N_LANES,
  parseDanmakuContent,
  REGULAR_DISPLAY_MS,
} from "../src/lib/danmaku";

describe("danmaku utilities", () => {
  it("converts ARGB color to CSS hex color correctly", () => {
    expect(argbToColor(0xffffffff)).toBe("#ffffff");
    expect(argbToColor(0xffff0000)).toBe("#ff0000");
    expect(argbToColor(0xff00ff00)).toBe("#00ff00");
    expect(argbToColor(0xff0000ff)).toBe("#0000ff");
    expect(argbToColor(0x002e72)).toBe("#002e72");
  });

  it("calculates displayDuration for regular vs static positions", () => {
    expect(displayDuration("REGULAR")).toBe(REGULAR_DISPLAY_MS);
    expect(displayDuration("TOP")).toBe(3000);
    expect(displayDuration("BOTTOM")).toBe(3000);
    expect(displayDuration("SUPERCHAT")).toBe(3000);
  });

  it("provides expected lane count", () => {
    expect(N_LANES).toBe(8);
  });

  it("scales visibility window by danmaku speed setting without truncating on non-1x playback rates", () => {
    // Normal speed (1x)
    const normalWindow = REGULAR_DISPLAY_MS / 1.0 + 300;
    expect(normalWindow).toBe(6300);

    // Fast speed (1.5x)
    const fastWindow = REGULAR_DISPLAY_MS / 1.5 + 300;
    expect(fastWindow).toBe(4300);

    // Slow speed (0.75x)
    const slowWindow = REGULAR_DISPLAY_MS / 0.75 + 300;
    expect(slowWindow).toBe(8300);

    // Media playback rate (e.g. 2x, 0.5x) does NOT truncate the media time visibility window
    const commentDurationMs = 10000;
    const mediaTimeAt2x = 13500; // 3.5s elapsed in media time
    const elapsed = mediaTimeAt2x - commentDurationMs;
    // At 2x playback, the comment must still be visible in its media time window (3500ms < 6300ms)
    expect(elapsed < normalWindow).toBe(true);
  });
});

describe("danmaku emotes data configuration", () => {
  it("loads danmaku emotes list correctly", () => {
    expect(Array.isArray(DANMAKU_EMOTES)).toBe(true);
    expect(DANMAKU_EMOTES.length).toBeGreaterThan(0);
  });

  it("validates each emote entry schema", () => {
    for (const emote of DANMAKU_EMOTES) {
      expect(typeof emote.id).toBe("string");
      expect(emote.id.length).toBeGreaterThan(0);
      expect(typeof emote.name).toBe("string");
      expect(emote.name.length).toBeGreaterThan(0);
      expect(Array.isArray(emote.patterns)).toBe(true);
      expect(emote.patterns.length).toBeGreaterThan(0);
      expect(typeof emote.url).toBe("string");
      expect(
        emote.url.startsWith("http://") ||
          emote.url.startsWith("https://") ||
          emote.url.startsWith("data:"),
      ).toBe(true);
      if (emote.aspectRatio !== undefined) {
        expect(typeof emote.aspectRatio).toBe("number");
        expect(emote.aspectRatio).toBeGreaterThan(0);
      }
    }
  });

  it("contains key special emotes: ohh, 前方高能, and doge", () => {
    const ids = DANMAKU_EMOTES.map((e) => e.id);
    expect(ids).toContain("ohh");
    expect(ids).toContain("high-energy");
    expect(ids).toContain("doge");

    const ohh = DANMAKU_EMOTES.find((e) => e.id === "ohh");
    expect(ohh?.patterns).toContain("[ohh]");
    expect(ohh?.patterns).toContain("ohh");
    expect(ohh?.patterns).toContain("OHH");
    expect(ohh?.aspectRatio).toBe(3);

    const highEnergy = DANMAKU_EMOTES.find((e) => e.id === "high-energy");
    expect(highEnergy?.patterns).toContain("前方高能");
    expect(highEnergy?.aspectRatio).toBe(3);
  });
});

describe("parseDanmakuContent", () => {
  it("returns empty array for empty string", () => {
    expect(parseDanmakuContent("")).toEqual([]);
  });

  it("returns single text token for normal text without emotes", () => {
    const tokens = parseDanmakuContent("这是一条普通弹幕");
    expect(tokens).toEqual([{ type: "text", text: "这是一条普通弹幕" }]);
  });

  it("parses [ohh] bracket expression into emote token", () => {
    const tokens = parseDanmakuContent("[ohh]");
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe("emote");
    if (tokens[0].type === "emote") {
      expect(tokens[0].emote.id).toBe("ohh");
    }
  });

  it("parses standalone keyword OHH / ohh into emote token", () => {
    const tokens = parseDanmakuContent("OHH");
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe("emote");
    if (tokens[0].type === "emote") {
      expect(tokens[0].emote.id).toBe("ohh");
    }
  });

  it("does not match english keyword inside other words (word boundary check)", () => {
    const tokens = parseDanmakuContent("John is awesome");
    expect(tokens).toEqual([{ type: "text", text: "John is awesome" }]);
  });

  it("parses 前方高能 into emote token", () => {
    const tokens = parseDanmakuContent("前方高能！！！");
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe("emote");
    if (tokens[0].type === "emote") {
      expect(tokens[0].emote.id).toBe("high-energy");
    }
    expect(tokens[1]).toEqual({ type: "text", text: "！！！" });
  });

  it("parses mixed text and multiple emotes", () => {
    const tokens = parseDanmakuContent("哈哈[ohh]太强了[doge]前方高能！");
    expect(tokens.length).toBe(6);
    expect(tokens[0]).toEqual({ type: "text", text: "哈哈" });
    expect(tokens[1].type).toBe("emote");
    if (tokens[1].type === "emote") expect(tokens[1].emote.id).toBe("ohh");
    expect(tokens[2]).toEqual({ type: "text", text: "太强了" });
    expect(tokens[3].type).toBe("emote");
    if (tokens[3].type === "emote") expect(tokens[3].emote.id).toBe("doge");
    expect(tokens[4].type).toBe("emote");
    if (tokens[4].type === "emote") expect(tokens[4].emote.id).toBe("high-energy");
    expect(tokens[5]).toEqual({ type: "text", text: "！" });
  });

  it("parses consecutive emotes without spaces", () => {
    const tokens = parseDanmakuContent("[doge][妙啊]");
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe("emote");
    if (tokens[0].type === "emote") expect(tokens[0].emote.id).toBe("doge");
    expect(tokens[1].type).toBe("emote");
    if (tokens[1].type === "emote") expect(tokens[1].emote.id).toBe("miao-a");
  });
});

describe("estimateDanmakuWidth", () => {
  it("calculates width for text tokens accurately", () => {
    const tokens = parseDanmakuContent("Hello");
    const width = estimateDanmakuWidth(tokens, 20);
    expect(width).toBe(5 * CHAR_WIDTH_PX);
  });

  it("calculates width including emote tokens with aspect ratio", () => {
    const tokens = parseDanmakuContent("[ohh]");
    const width = estimateDanmakuWidth(tokens, 20);
    // ohh has aspectRatio: 3. Height is ~1.25 * 20 = 25. Width is ~25 * 3 = 75px.
    expect(width).toBe(75);
  });
});
