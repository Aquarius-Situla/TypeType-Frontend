import { expect, test } from "bun:test";
import { claimStreamRefresh, refreshesExpiredLinks } from "../src/lib/stream-refresh";

const MINUTE = 60_000;

test("refreshes a stream that outlived its media links once", () => {
  const claim = { refreshedFor: null };

  expect(claimStreamRefresh(claim, 1_000, 1_000 + 61 * MINUTE)).toBe(true);
  expect(claimStreamRefresh(claim, 1_000, 1_000 + 62 * MINUTE)).toBe(false);
});

test("a fresh stream falls back to the usual recovery", () => {
  const claim = { refreshedFor: null };

  expect(claimStreamRefresh(claim, 1_000, 1_000 + 2 * MINUTE)).toBe(false);
});

test("a refreshed stream can be refreshed again once it ages", () => {
  const claim = { refreshedFor: null };

  expect(claimStreamRefresh(claim, 1_000, 1_000 + 61 * MINUTE)).toBe(true);
  const reloadedAt = 1_000 + 61 * MINUTE;
  expect(claimStreamRefresh(claim, reloadedAt, reloadedAt + MINUTE)).toBe(false);
  expect(claimStreamRefresh(claim, reloadedAt, reloadedAt + 61 * MINUTE)).toBe(true);
});

test("Bilibili and NicoNico refresh expired media links", () => {
  expect(refreshesExpiredLinks("bilibili")).toBe(true);
  expect(refreshesExpiredLinks("nicovideo")).toBe(true);
  expect(refreshesExpiredLinks("youtube")).toBe(false);
});
