import { API_BASE } from "./env";
import { optionalBearer } from "./optional-bearer";

export type LiveChatMessage = {
  id: string;
  text: string;
  receivedAtMs: number;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  moderator?: boolean;
};

export class LiveChatRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "LiveChatRequestError";
  }
}

export function liveChatRetryDelay(error: unknown, attempt: number): number | null {
  if (attempt >= 5) return null;
  if (
    error instanceof LiveChatRequestError &&
    error.status !== 408 &&
    error.status !== 429 &&
    error.status < 500
  )
    return null;
  return Math.min(1000 * 2 ** attempt, 15000);
}

export type LiveChatEvent =
  | { type: "connected" }
  | { type: "message"; message: LiveChatMessage }
  | { type: "ended" };

export async function connectYoutubeLiveChat(
  videoUrl: string,
  signal: AbortSignal,
  onEvent: (event: LiveChatEvent) => void,
) {
  const query = new URLSearchParams({ url: videoUrl });
  const response = await fetch(
    `${API_BASE}/live-chat?${query}`,
    optionalBearer({ signal, headers: { Accept: "text/event-stream, application/json" } }),
  );
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const reason =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `Live chat request failed (HTTP ${response.status})`;
    throw new LiveChatRequestError(reason, response.status);
  }
  if (!response.headers.get("Content-Type")?.includes("text/event-stream") || !response.body) {
    throw new Error("Live chat stream is unavailable");
  }
  onEvent({ type: "connected" });
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
    await reader.cancel().catch(() => undefined);
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
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
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
    Number.isFinite(value.receivedAtMs) &&
    (value.authorName == null || typeof value.authorName === "string") &&
    (value.authorAvatarUrl == null || typeof value.authorAvatarUrl === "string") &&
    (value.moderator === undefined || typeof value.moderator === "boolean")
  );
}
