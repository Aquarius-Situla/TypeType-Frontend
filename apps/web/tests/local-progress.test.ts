import "./setup";
import { beforeEach, describe, expect, it } from "bun:test";
import {
  getBatchLocalProgress,
  getLocalProgress,
  pruneLocalProgress,
  saveLocalProgress,
} from "../src/lib/local-progress";

describe("local-progress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null for non-existent or empty videoUrl", () => {
    expect(getLocalProgress("")).toBeNull();
    expect(getLocalProgress("https://example.com/not-saved")).toBeNull();
  });

  it("saves and retrieves progress accurately", () => {
    const url = "https://example.com/watch?v=abc";
    saveLocalProgress(url, 142.6, 1700000000000);

    const record = getLocalProgress(url);
    expect(record).toEqual({
      videoUrl: url,
      position: 143,
      updatedAt: 1700000000000,
    });
  });

  it("gracefully ignores corrupted JSON in localStorage", () => {
    const url = "https://example.com/watch?v=corrupted";
    localStorage.setItem(`typetype:progress:${url}`, "{not-valid-json");

    expect(getLocalProgress(url)).toBeNull();
  });

  it("handles batch progress queries", () => {
    const url1 = "https://example.com/video1";
    const url2 = "https://example.com/video2";
    const url3 = "https://example.com/video3";

    saveLocalProgress(url1, 10, 1000);
    saveLocalProgress(url2, 20, 2000);

    const batch = getBatchLocalProgress([url1, url2, url3]);
    expect(batch.size).toBe(2);
    expect(batch.get(url1)?.position).toBe(10);
    expect(batch.get(url2)?.position).toBe(20);
    expect(batch.has(url3)).toBe(false);
  });

  it("prunes oldest entries when exceeding maxEntries", () => {
    for (let i = 1; i <= 5; i++) {
      saveLocalProgress(`https://example.com/v${i}`, i * 10, i * 1000);
    }

    // Keep only the 2 newest entries (v4 and v5)
    pruneLocalProgress(2);

    expect(getLocalProgress("https://example.com/v1")).toBeNull();
    expect(getLocalProgress("https://example.com/v2")).toBeNull();
    expect(getLocalProgress("https://example.com/v3")).toBeNull();
    expect(getLocalProgress("https://example.com/v4")?.position).toBe(40);
    expect(getLocalProgress("https://example.com/v5")?.position).toBe(50);
  });
});
