import { describe, expect, it } from "bun:test";
import { currentDanmakuAirdrop, danmakuAirdropSeconds } from "../src/lib/danmaku-airdrop";
import type { BulletCommentItem } from "../src/types/api";

function comment(text: string, durationMs: number): BulletCommentItem {
  return {
    text,
    argbColor: 0xffffffff,
    position: "REGULAR",
    relativeFontSize: 1,
    durationMs,
    isLive: false,
  };
}

describe("danmaku airdrop", () => {
  it("reads minute and hour timecodes inside the text", () => {
    expect(danmakuAirdropSeconds("空降 02:35")).toBe(155);
    expect(danmakuAirdropSeconds("指路 5:10 高能")).toBe(310);
    expect(danmakuAirdropSeconds("01:23:45 核心看点")).toBe(5025);
    expect(danmakuAirdropSeconds("0:45")).toBe(45);
  });

  it("ignores text without a valid timecode", () => {
    expect(danmakuAirdropSeconds("哈哈哈")).toBeNull();
    expect(danmakuAirdropSeconds("2:75")).toBeNull();
    expect(danmakuAirdropSeconds("比分 3:2")).toBeNull();
    expect(danmakuAirdropSeconds("1:2:3:4")).toBeNull();
  });

  it("offers the newest airdrop sent in the last seconds", () => {
    const comments = [comment("空降 02:00", 9_000), comment("空降 03:00", 10_000)];
    expect(currentDanmakuAirdrop(comments, 12_000, 600)).toEqual({ key: "1:180", seconds: 180 });
  });

  it("drops airdrops that are too old, beyond the video or close to the position", () => {
    expect(currentDanmakuAirdrop([comment("02:00", 1_000)], 12_000, 600)).toBeNull();
    expect(currentDanmakuAirdrop([comment("12:00", 10_000)], 12_000, 600)).toBeNull();
    expect(currentDanmakuAirdrop([comment("0:14", 10_000)], 12_000, 600)).toBeNull();
    expect(currentDanmakuAirdrop([comment("02:00", 10_000)], 12_000, Number.NaN)).toBeNull();
  });
});
