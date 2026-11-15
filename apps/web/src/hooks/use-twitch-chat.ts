import { useEffect, useState } from "react";
import { twitchChatEventsUrl } from "../lib/api-twitch";
import { readEventStream } from "../lib/event-stream";
import { applyChatEvent, type ChatState, EMPTY_CHAT } from "../lib/twitch-chat";
import type { TwitchChatEvent } from "../types/twitch";

export type ChatStatus = "connecting" | "live" | "reconnecting";

const MAX_BACKOFF_MS = 30_000;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function useTwitchChat(login: string): { chat: ChatState; status: ChatStatus } {
  const [chat, setChat] = useState<ChatState>(EMPTY_CHAT);
  const [status, setStatus] = useState<ChatStatus>("connecting");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setChat(EMPTY_CHAT);
    setStatus("connecting");
    const onData = (data: string) => {
      try {
        const event = JSON.parse(data) as TwitchChatEvent;
        setStatus("live");
        setChat((current) => applyChatEvent(current, event));
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
        setStatus("reconnecting");
        if (Date.now() - started > 60_000) backoff = 1_000;
        await wait(backoff, signal);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    };
    void run();
    return () => controller.abort();
  }, [login]);

  return { chat, status };
}
