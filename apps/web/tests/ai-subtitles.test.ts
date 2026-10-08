import { describe, expect, it } from "bun:test";
import {
  buildWebVtt,
  formatVttTimestamp,
  parseVttTimestamp,
  parseWebVtt,
  vttToDataUrl,
} from "../src/lib/ai-subtitles";
import { useAiSubtitlesStore } from "../src/stores/ai-subtitles-store";

describe("AI Subtitles Library & Store", () => {
  it("formats and parses WebVTT timestamps accurately", () => {
    expect(formatVttTimestamp(0)).toBe("00:00:00.000");
    expect(formatVttTimestamp(65.42)).toBe("00:01:05.420");
    expect(formatVttTimestamp(3661.123)).toBe("01:01:01.123");

    expect(parseVttTimestamp("00:01:05.420")).toBeCloseTo(65.42, 2);
    expect(parseVttTimestamp("01:01:01.123")).toBeCloseTo(3661.123, 2);
  });

  it("builds and parses WebVTT content correctly", () => {
    const cues = [
      { startSeconds: 1.5, endSeconds: 4.2, text: "你好，欢迎观看！" },
      { startSeconds: 5.0, endSeconds: 8.5, text: "今天我们介绍 AI 字幕功能。" },
    ];

    const vtt = buildWebVtt(cues);
    expect(vtt.startsWith("WEBVTT")).toBe(true);
    expect(vtt).toContain("00:00:01.500 --> 00:00:04.200");
    expect(vtt).toContain("你好，欢迎观看！");

    const parsed = parseWebVtt(vtt);
    expect(parsed.length).toBe(2);
    expect(parsed[0].startSeconds).toBeCloseTo(1.5, 2);
    expect(parsed[0].text).toBe("你好，欢迎观看！");
    expect(parsed[1].endSeconds).toBeCloseTo(8.5, 2);
    expect(parsed[1].text).toBe("今天我们介绍 AI 字幕功能。");
  });

  it("converts WebVTT into a valid data URI", () => {
    const vtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nHello";
    const dataUrl = vttToDataUrl(vtt);
    expect(dataUrl.startsWith("data:text/vtt;charset=utf-8,")).toBe(true);
  });

  it("manages LLM configuration and subtitle caching in store", () => {
    const store = useAiSubtitlesStore.getState();

    store.setEndpoint("https://api.deepseek.com/v1");
    store.setModel("deepseek-chat");
    store.setApiKey("sk-test-key-12345");
    store.setTargetLanguage("zh");

    const state = useAiSubtitlesStore.getState();
    expect(state.endpoint).toBe("https://api.deepseek.com/v1");
    expect(state.model).toBe("deepseek-chat");
    expect(state.apiKey).toBe("sk-test-key-12345");
    expect(state.targetLanguage).toBe("zh");

    // Cache a track
    const testTrack = {
      vtt: "WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\n测试字幕",
      languageTag: "zh-AI",
      displayLanguageName: "✨ AI 字幕 (zh)",
      generatedAt: Date.now(),
    };
    store.cacheTrack("BV_TEST_123", testTrack);

    const cached = useAiSubtitlesStore.getState().getCachedTrack("BV_TEST_123");
    expect(cached).toBeDefined();
    expect(cached?.languageTag).toBe("zh-AI");
    expect(cached?.vtt).toContain("测试字幕");

    // Clear cache
    store.clearCache();
    expect(useAiSubtitlesStore.getState().getCachedTrack("BV_TEST_123")).toBeUndefined();
  });
});
