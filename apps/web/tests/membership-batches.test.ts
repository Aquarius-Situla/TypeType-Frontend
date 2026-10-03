import { afterEach, expect, test } from "bun:test";
import { MembershipUpdateError, updateGroupMemberships } from "../src/lib/api-subscription-groups";
import { membershipBatches } from "../src/lib/membership-batches";
import { useAuthStore } from "../src/stores/auth-store";

const bodyBytes = (channelUrls: string[]): number =>
  new TextEncoder().encode(JSON.stringify({ channelUrls })).byteLength;
const MAX_BYTES = 1024 * 1024;
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("a body exactly 1 MiB fits, and adding another URL starts a new batch", () => {
  const urls = Array.from({ length: 499 }, (_, i) => `https://example.org/${i}/`.padEnd(2048, "a"));
  let remaining = MAX_BYTES - bodyBytes(urls);
  for (let i = 0; remaining > 0; i++) {
    const added = Math.min(remaining, 4000);
    const count = Math.ceil(added / 2);
    urls[i] =
      urls[i].slice(0, -count) + "界".repeat(Math.floor(added / 2)) + (added % 2 ? "é" : "");
    remaining -= added;
  }
  expect(bodyBytes(urls)).toBe(MAX_BYTES);
  const { batches, invalid } = membershipBatches([...urls, "https://example.org/extra"]);
  expect(invalid).toEqual([]);
  expect(batches).toEqual([urls, ["https://example.org/extra"]]);
});

test("UTF-8 and JSON escapes count toward the byte limit without losing channels", () => {
  const urls = Array.from(
    { length: 600 },
    (_, i) => `https://example.org/${i}/${'界\\"'.repeat(670)}`,
  );
  const { batches, invalid } = membershipBatches([...urls, urls[0]]);
  expect(invalid).toEqual([]);
  expect(batches.flat()).toEqual(urls);
  expect(batches.every((batch) => batch.length <= 500 && bodyBytes(batch) <= MAX_BYTES)).toBe(true);
  expect(batches.length).toBeGreaterThan(2);
});

test("overlong URLs are reported without preventing valid membership writes", async () => {
  useAuthStore.getState().setToken("membership-test");
  const calls: string[][] = [];
  globalThis.fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)).channelUrls);
    return new Response(null, { status: 204 });
  };
  const valid = "https://example.org/".padEnd(2048, "a");
  const invalid = `${valid}a`;
  try {
    await updateGroupMemberships([
      { groupId: "tech", action: "add", channelUrls: [invalid, valid] },
    ]);
    throw new Error("Expected invalid URL");
  } catch (error) {
    expect(error).toBeInstanceOf(MembershipUpdateError);
    if (error instanceof MembershipUpdateError) expect(error.failedUrls).toEqual([invalid]);
  }
  expect(calls).toEqual([[valid]]);
});

test("a large edit has at most three requests in flight and preserves operation order", async () => {
  useAuthStore.getState().setToken("membership-test");
  let active = 0;
  let peak = 0;
  const methods: string[] = [];
  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method ?? "GET");
    active++;
    peak = Math.max(peak, active);
    await Bun.sleep(1);
    active--;
    return new Response(null, { status: 204 });
  };
  const channelUrls = Array.from({ length: 5001 }, (_, i) => `https://example.org/${i}`);
  await updateGroupMemberships([
    { groupId: "tech", action: "add", channelUrls },
    { groupId: "tech", action: "remove", channelUrls: [channelUrls[0]] },
  ]);
  expect(peak).toBe(3);
  expect(active).toBe(0);
  expect(methods).toEqual([...Array(11).fill("PUT"), "DELETE"]);
});
