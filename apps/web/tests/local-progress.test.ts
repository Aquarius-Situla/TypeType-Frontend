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
    localStorage.setItem(`typetype:progress:anonymous:${url}`, "{not-valid-json");

    expect(getLocalProgress(url)).toBeNull();
  });

  it("keeps progress isolated between accounts and anonymous playback", () => {
    const url = "https://example.com/watch?v=shared";
    saveLocalProgress(url, 45, 1000, "account-a");
    saveLocalProgress(url, 90, 2000, "account-b");

    expect(getLocalProgress(url, "account-a")?.position).toBe(45);
    expect(getLocalProgress(url, "account-b")?.position).toBe(90);
    expect(getLocalProgress(url)).toBeNull();
  });

  it("does not reuse legacy cache entries without an account identity", () => {
    const url = "https://example.com/watch?v=legacy";
    localStorage.setItem(
      `typetype:progress:${url}`,
      JSON.stringify({ position: 45, updatedAt: 1000 }),
    );

    expect(getLocalProgress(url)).toBeNull();
    expect(getLocalProgress(url, "account-a")).toBeNull();
  });

  it("handles batch progress queries", () => {
    const url1 = "https://example.com/video1";
    const url2 = "https://example.com/video2";
    const url3 = "https://example.com/video3";

    saveLocalProgress(url1, 10, 1000);
    saveLocalProgress(url2, 20, 2000);
    saveLocalProgress(url1, 99, 3000, "account-b");

    const batch = getBatchLocalProgress([url1, url2, url3]);
    expect(batch.size).toBe(2);
    expect(batch.get(url1)?.position).toBe(10);
    expect(batch.get(url2)?.position).toBe(20);
    expect(batch.has(url3)).toBe(false);

    const accountBatch = getBatchLocalProgress([url1, url2, url3], "account-b");
    expect(accountBatch.size).toBe(1);
    expect(accountBatch.get(url1)?.position).toBe(99);
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
