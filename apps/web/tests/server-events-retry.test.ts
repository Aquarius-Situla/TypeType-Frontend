import { afterEach, expect, test } from "bun:test";
import { type ServerEventHandlers, watchServerEvents } from "../src/lib/server-events";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

const HELLO = 'event: hello\ndata: {"bootId":"boot-1"}\n\n';

function helloThenClose(): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(HELLO));
        controller.close();
      },
    }),
    { status: 200 },
  );
}

function helloAndHold(): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(HELLO));
      },
    }),
    { status: 200 },
  );
}

function watchUntilHellos(count: number, seen: string[]): Promise<void> {
  return new Promise((resolve) => {
    let hellos = 0;
    const handlers: ServerEventHandlers = {
      onHello: () => {
        seen.push("hello");
        hellos += 1;
        if (hellos === count) {
          stop();
          resolve();
        }
      },
      onNotice: () => undefined,
      onCleared: () => undefined,
      onLost: () => seen.push("lost"),
      onReachable: () => seen.push("reachable"),
    };
    const stop = watchServerEvents(handlers);
  });
}

test("a 404 from a proxy while the server restarts does not stop the reconnects", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) return helloThenClose();
    if (calls === 2) return new Response("not found", { status: 404 });
    return helloAndHold();
  }) as unknown as typeof fetch;
  const seen: string[] = [];
  await watchUntilHellos(2, seen);
  expect(seen).toEqual(["hello", "lost", "lost", "hello"]);
}, 15_000);

test("a reconnect that never answers is given up and tried again", async () => {
  let calls = 0;
  globalThis.fetch = ((_url: string, init?: RequestInit) => {
    calls += 1;
    if (calls === 1) return Promise.resolve(helloThenClose());
    if (calls === 2) {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    }
    return Promise.resolve(helloAndHold());
  }) as unknown as typeof fetch;
  const seen: string[] = [];
  await watchUntilHellos(2, seen);
  expect(seen).toEqual(["hello", "lost", "lost", "hello"]);
}, 25_000);

test("a first connect that holds its headers back is not reported lost", async () => {
  globalThis.fetch = ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    })) as unknown as typeof fetch;
  const seen: string[] = [];
  const stop = watchServerEvents({
    onHello: () => seen.push("hello"),
    onNotice: () => undefined,
    onCleared: () => undefined,
    onLost: () => seen.push("lost"),
    onReachable: () => seen.push("reachable"),
  });
  await new Promise((resolve) => setTimeout(resolve, 12_000));
  stop();
  expect(seen).toEqual([]);
}, 20_000);
