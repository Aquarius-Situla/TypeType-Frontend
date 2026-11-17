import { afterEach, describe, expect, test } from "bun:test";
import { readEventStream } from "../src/lib/event-stream";

const realFetch = globalThis.fetch;

function respond(status: number, body: string) {
  globalThis.fetch = (async () => new Response(body, { status })) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("readEventStream open", () => {
  test("reports the open stream before any event", async () => {
    respond(200, ": ping\n\ndata: {}\n\n");
    const calls: string[] = [];
    await readEventStream(
      "/events",
      () => calls.push("data"),
      new AbortController().signal,
      () => calls.push("open"),
    );
    expect(calls).toEqual(["open", "data"]);
  });

  test("an open stream without events still reports open", async () => {
    respond(200, ": ping\n\n");
    let opened = false;
    await readEventStream(
      "/events",
      () => undefined,
      new AbortController().signal,
      () => {
        opened = true;
      },
    );
    expect(opened).toBe(true);
  });

  test("a refused stream never reports open", async () => {
    respond(502, "");
    let opened = false;
    const read = readEventStream(
      "/events",
      () => undefined,
      new AbortController().signal,
      () => {
        opened = true;
      },
    );
    await expect(read).rejects.toThrow("502");
    expect(opened).toBe(false);
  });
});
