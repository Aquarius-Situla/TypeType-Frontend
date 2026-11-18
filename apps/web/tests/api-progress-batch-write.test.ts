import { afterEach, beforeEach, expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import { updateProgressMany } from "../src/lib/api-collections";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
type Call = { url: string; method: string; items: Array<{ videoUrl: string; position: number }> };
let calls: Call[] = [];
let status = 200;

beforeEach(() => {
  calls = [];
  status = 200;
  useAuthStore.getState().setToken("progress-batch-write-test");
  globalThis.fetch = async (input, init) => {
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : { items: [] };
    calls.push({ url: String(input), method: init?.method ?? "GET", items: body.items });
    if (status !== 200) return Response.json({ error: "Too many requests" }, { status });
    return Response.json(body.items);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("marks many videos with one request per 200 videos", async () => {
  const writes = Array.from({ length: 450 }, (_, index) => ({
    url: `https://youtube.com/watch?v=${index}`,
    position: index * 1000.4,
  }));
  await updateProgressMany(writes);
  expect(calls.map((call) => call.items.length)).toEqual([200, 200, 50]);
  expect(calls.every((call) => call.method === "PUT" && call.url.endsWith("/progress/batch"))).toBe(
    true,
  );
  expect(calls[0].items[1]).toEqual({ videoUrl: "https://youtube.com/watch?v=1", position: 1000 });
});

test("keeps the last position of a repeated video", async () => {
  await updateProgressMany([
    { url: "https://youtube.com/watch?v=a", position: 5000 },
    { url: "https://youtube.com/watch?v=a", position: 0 },
  ]);
  expect(calls[0].items).toEqual([{ videoUrl: "https://youtube.com/watch?v=a", position: 0 }]);
});

test("reports a refused batch", async () => {
  status = 429;
  const result = updateProgressMany([{ url: "https://youtube.com/watch?v=a", position: 1 }]);
  await expect(result).rejects.toBeInstanceOf(ApiError);
});
