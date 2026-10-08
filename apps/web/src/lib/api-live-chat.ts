import { API_BASE } from "./env";
import { optionalBearer } from "./optional-bearer";

export type LiveChatMessage = {
  id: string;
  text: string;
  receivedAtMs: number;
};

export type LiveChatEvent = { type: "message"; message: LiveChatMessage } | { type: "ended" };

export async function connectYoutubeLiveChat(
  videoUrl: string,
  signal: AbortSignal,
  onEvent: (event: LiveChatEvent) => void,
) {
  const query = new URLSearchParams({ url: videoUrl });
  const response = await fetch(
    `${API_BASE}/live-chat?${query}`,
    optionalBearer({ signal, headers: { Accept: "text/event-stream" } }),
  );
  if (!response.ok) throw new Error("Live chat request failed");
  if (!response.headers.get("Content-Type")?.includes("text/event-stream") || !response.body) {
    throw new Error("Live chat stream is unavailable");
  }
  await consumeLiveChatEvents(response.body, onEvent);
}

export async function consumeLiveChatEvents(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: LiveChatEvent) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        dispatchSseBlock(buffer.slice(0, boundary), onEvent);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (buffer.trim()) dispatchSseBlock(buffer, onEvent);
  } finally {
    reader.releaseLock();
  }
}

function dispatchSseBlock(block: string, onEvent: (event: LiveChatEvent) => void) {
  let eventName = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "");
    if (field === "event") eventName = value;
    if (field === "data") data.push(value);
  }
  if (!data.length) return;
  if (eventName === "ended") {
    onEvent({ type: "ended" });
    return;
  }
  const payload: unknown = JSON.parse(data.join("\n"));
  if (eventName === "error") {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Live chat retrieval failed";
    throw new Error(message);
  }
  if (eventName !== "message" || !isLiveChatMessage(payload)) return;
  onEvent({ type: "message", message: payload });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLiveChatMessage(value: unknown): value is LiveChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.receivedAtMs === "number" &&
    Number.isFinite(value.receivedAtMs)
  );
}
