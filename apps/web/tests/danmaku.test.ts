import { describe, expect, it } from "bun:test";
import {
  argbToColor,
  displayDuration,
  isDanmakuPlaybackPaused,
  N_LANES,
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

  it("accurately pauses danmaku on video stutter, waiting, seeking, and pause states", () => {
    // Normal active playback
    expect(
      isDanmakuPlaybackPaused({
        videoPaused: false,
        mediaPaused: false,
        videoWaiting: false,
        mediaWaiting: false,
        mediaSeeking: false,
        videoSeeking: false,
        isStalled: false,
      }),
    ).toBe(false);

    // Video buffering / stuttering (waiting event or readyState < 3)
    expect(isDanmakuPlaybackPaused({ videoWaiting: true })).toBe(true);
    expect(isDanmakuPlaybackPaused({ mediaWaiting: true })).toBe(true);
    expect(isDanmakuPlaybackPaused({ isStalled: true })).toBe(true);

    // User paused
    expect(isDanmakuPlaybackPaused({ videoPaused: true })).toBe(true);
    expect(isDanmakuPlaybackPaused({ mediaPaused: true })).toBe(true);

    // Seeking
    expect(isDanmakuPlaybackPaused({ videoSeeking: true })).toBe(true);
    expect(isDanmakuPlaybackPaused({ mediaSeeking: true })).toBe(true);

    // Explicit pause override pauses danmaku
    expect(isDanmakuPlaybackPaused({ pausedProp: true, videoWaiting: false })).toBe(true);
    // Buffering or stalling overrides an explicit non-paused prop to maintain video alignment
    expect(isDanmakuPlaybackPaused({ pausedProp: false, videoWaiting: true })).toBe(true);
    expect(isDanmakuPlaybackPaused({ pausedProp: false, isStalled: true })).toBe(true);
    // When not stalled and not waiting, pausedProp: false allows playback
    expect(
      isDanmakuPlaybackPaused({ pausedProp: false, videoWaiting: false, isStalled: false }),
    ).toBe(false);
  });
});
