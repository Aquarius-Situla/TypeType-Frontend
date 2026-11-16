import type { TwitchChatEvent } from "../types/twitch";
import { twitchChatEventsUrl } from "./api-twitch";
import { readEventStream } from "./event-stream";
import { applyChatEvent, type ChatState, EMPTY_CHAT } from "./twitch-chat";

type ChatStatus = "connecting" | "live" | "reconnecting";
export type ChatSnapshot = { chat: ChatState; status: ChatStatus };

const MAX_BACKOFF_MS = 30_000;

type Stream = { snapshot: ChatSnapshot; listeners: Set<() => void>; controller: AbortController };

// One event stream per channel, shared by every chat view of it (the page column and the fullscreen overlay), so a
// second view neither opens another connection nor starts from an empty history.
const streams = new Map<string, Stream>();

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function update(stream: Stream, next: Partial<ChatSnapshot>): void {
  stream.snapshot = { ...stream.snapshot, ...next };
  for (const listener of stream.listeners) listener();
}

function open(login: string): Stream {
  const stream: Stream = {
    snapshot: { chat: EMPTY_CHAT, status: "connecting" },
    listeners: new Set(),
    controller: new AbortController(),
  };
  const { signal } = stream.controller;
  const onData = (data: string) => {
    try {
      const event = JSON.parse(data) as TwitchChatEvent;
      update(stream, { status: "live", chat: applyChatEvent(stream.snapshot.chat, event) });
    } catch {
      return;
    }
  };
  const run = async () => {
    let backoff = 1_000;
    while (!signal.aborted) {
      const started = Date.now();
      await readEventStream(twitchChatEventsUrl(login), onData, signal).catch(() => undefined);
      if (signal.aborted) return;
      update(stream, { status: "reconnecting" });
      if (Date.now() - started > 60_000) backoff = 1_000;
      await wait(backoff, signal);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
    }
  };
  void run();
  return stream;
}

export function subscribeChat(login: string, listener: () => void): () => void {
  let stream = streams.get(login);
  if (!stream) {
    stream = open(login);
    streams.set(login, stream);
  }
  const current = stream;
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;
    current.controller.abort();
    if (streams.get(login) === current) streams.delete(login);
  };
}

const IDLE: ChatSnapshot = { chat: EMPTY_CHAT, status: "connecting" };

export function chatSnapshot(login: string): ChatSnapshot {
  return streams.get(login)?.snapshot ?? IDLE;
}
