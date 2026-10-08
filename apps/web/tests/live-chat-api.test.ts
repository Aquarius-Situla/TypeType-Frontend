import { expect, test } from "bun:test";
import { consumeLiveChatEvents } from "../src/lib/api-live-chat";

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
      controller.enqueue(new TextEncoder().encode('event: error\ndata: {"message":"failed"}\n\n'));
      controller.close();
    },
  });
  await expect(consumeLiveChatEvents(stream, () => undefined)).rejects.toThrow("failed");
});
