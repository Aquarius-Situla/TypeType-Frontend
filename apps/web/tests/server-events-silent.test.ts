import { afterEach, expect, test } from "bun:test";
import { watchServerEvents } from "../src/lib/server-events";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

// A proxy that buffers the event stream answers 200 and then holds every byte back.
test("a dropped stream that comes back silent is reported reachable", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("network");
    return new Response(new ReadableStream({ start() {} }), { status: 200 });
  }) as unknown as typeof fetch;
  const seen: string[] = [];
  const reached = new Promise<void>((resolve) => {
    const stop = watchServerEvents({
      onHello: () => seen.push("hello"),
      onNotice: () => undefined,
      onCleared: () => undefined,
      onLost: () => seen.push("lost"),
      onReachable: () => {
        seen.push("reachable");
        stop();
        resolve();
      },
    });
  });
  await reached;
  expect(seen).toEqual(["lost", "reachable"]);
}, 10_000);
