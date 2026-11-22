import { expect, test } from "bun:test";
import { createVideoTitleStore } from "../src/lib/video-titles";

const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

test("ids asked together are read in one request and cached", async () => {
  const calls: string[][] = [];
  const store = createVideoTitleStore(async (ids) => {
    calls.push(ids);
    return { sm9: "Classic" };
  }, 1);
  let notified = 0;
  store.subscribe(() => notified++);
  store.request("sm9");
  store.request("av170001");
  store.request("sm9");
  await tick();
  expect(calls).toEqual([["sm9", "av170001"]]);
  expect(store.title("sm9")).toBe("Classic");
  expect(store.title("av170001")).toBeNull();
  store.request("sm9");
  store.request("av170001");
  await tick();
  expect(calls.length).toBe(1);
  expect(notified).toBe(1);
});

test("a failed request keeps the raw ids and is not retried in a loop", async () => {
  let calls = 0;
  const store = createVideoTitleStore(async () => {
    calls++;
    throw new Error("offline");
  }, 1);
  store.request("sm9");
  await tick();
  store.request("sm9");
  await tick();
  expect(store.title("sm9")).toBeNull();
  expect(calls).toBe(1);
});

test("large batches are split at the server cap", async () => {
  const sizes: number[] = [];
  const store = createVideoTitleStore(async (ids) => {
    sizes.push(ids.length);
    return {};
  }, 1);
  for (let i = 1; i <= 45; i++) store.request(`sm${i}`);
  await tick(20);
  expect(sizes).toEqual([30, 15]);
});
