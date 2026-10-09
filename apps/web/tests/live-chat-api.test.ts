import { expect, test } from "bun:test";
import {
  connectYoutubeLiveChat,
  consumeLiveChatEvents,
  LiveChatRequestError,
  liveChatRetryDelay,
} from "../src/lib/api-live-chat";

test("parses a message split across SSE chunks and ignores heartbeats", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\nevent: mess"));
      controller.enqueue(
        encoder.encode(
          'age\ndata: {"id":"m1","text":"hello","receivedAtMs":1}\n\n: keep-alive\n\n',
        ),
      );
      controller.close();
    },
  });
  const events: unknown[] = [];
  await consumeLiveChatEvents(stream, (event) => events.push(event));
  expect(events).toEqual([
    { type: "message", message: { id: "m1", text: "hello", receivedAtMs: 1 } },
  ]);
});

test("converts SSE errors to rejected requests", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode('event: error\ndata: {"error":"failed","code":"error"}\n\n'),
      );
      controller.close();
    },
  });
  await expect(consumeLiveChatEvents(stream, () => undefined)).rejects.toThrow("failed");
});

test("connects an empty stream and accepts JSON errors", async () => {
  const originalFetch = globalThis.fetch;
  const events: unknown[] = [];
  globalThis.fetch = (async (_input, init) => {
    expect(new Headers(init?.headers).get("Accept")).toContain("application/json");
    return new Response("", { headers: { "Content-Type": "text/event-stream" } });
  }) as typeof fetch;
  try {
    await connectYoutubeLiveChat(
      "https://www.youtube.com/watch?v=live",
      new AbortController().signal,
      (event) => events.push(event),
    );
    expect(events).toEqual([{ type: "connected" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves HTTP errors without marking the stream connected", async () => {
  const originalFetch = globalThis.fetch;
  const events: unknown[] = [];
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: "Chat disabled", code: "error" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  try {
    await expect(
      connectYoutubeLiveChat(
        "https://www.youtube.com/watch?v=live",
        new AbortController().signal,
        (event) => events.push(event),
      ),
    ).rejects.toThrow("Chat disabled");
    expect(events).toEqual([]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("cancels the connection when an SSE error interrupts consumption", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: error\ndata: {"error":"failed"}\n\n'));
    },
    cancel() {
      cancelled = true;
    },
  });
  await expect(consumeLiveChatEvents(stream, () => undefined)).rejects.toThrow("failed");
  expect(cancelled).toBe(true);
  expect(stream.locked).toBe(false);
});

test("preserves real author metadata and rejects invalid optional fields", async () => {
  const message = {
    id: "m2",
    text: "hello",
    receivedAtMs: 2,
    authorName: "Viewer",
    authorAvatarUrl: "https://example.com/avatar.jpg",
    moderator: true,
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const value of [
        message,
        { ...message, moderator: "yes" },
        { ...message, authorName: 42 },
      ]) {
        controller.enqueue(
          new TextEncoder().encode(`event: message\ndata: ${JSON.stringify(value)}\n\n`),
        );
      }
      controller.close();
    },
  });
  const events: unknown[] = [];
  await consumeLiveChatEvents(stream, (event) => events.push(event));
  expect(events).toEqual([{ type: "message", message }]);
});

test("retries transient chat failures with capped backoff", () => {
  expect(liveChatRetryDelay(new LiveChatRequestError("temporary", 502), 0)).toBe(1000);
  expect(liveChatRetryDelay(new LiveChatRequestError("busy", 429), 4)).toBe(15000);
  expect(liveChatRetryDelay(new TypeError("network"), 1)).toBe(2000);
  expect(liveChatRetryDelay(new Error("closed"), 5)).toBeNull();
});

test("does not retry permanent request and authentication errors", () => {
  for (const status of [400, 401, 403, 404, 422]) {
    expect(liveChatRetryDelay(new LiveChatRequestError("rejected", status), 0)).toBeNull();
  }
});
