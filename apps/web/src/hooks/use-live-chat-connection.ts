import { useEffect, useState } from "react";
import {
  connectYoutubeLiveChat,
  type LiveChatMessage,
  liveChatRetryDelay,
} from "../lib/api-live-chat";
import { debugConsole } from "../lib/debug-console";

export type LiveChatStatus = "connecting" | "connected" | "error" | "ended";
const MAX_MESSAGES = 200;

export function useLiveChatConnection(videoUrl: string, ended: boolean) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [status, setStatus] = useState<LiveChatStatus>(ended ? "ended" : "connecting");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (ended) {
      setStatus("ended");
      return;
    }
    const controller = new AbortController();
    let timer: number | undefined;
    let frame: number | undefined;
    let attempts = 0;
    let pending: LiveChatMessage[] = [];
    let replaceMessages = true;
    setMessages([]);
    setStatus("connecting");
    const flush = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      if (controller.signal.aborted || !pending.length) return;
      const batch = pending;
      pending = [];
      const replace = replaceMessages;
      replaceMessages = false;
      setMessages((current) => [...(replace ? [] : current), ...batch].slice(-MAX_MESSAGES));
    };
    const recover = (error: unknown) => {
      if (controller.signal.aborted) return;
      flush();
      debugConsole("live_chat.error", {
        message: error instanceof Error ? error.message : String(error),
        manualRetries: retryCount,
      });
      const delay = liveChatRetryDelay(error, attempts++);
      if (delay === null) {
        setStatus("error");
        return;
      }
      setStatus("connecting");
      timer = window.setTimeout(connect, delay);
    };
    const connect = () => {
      if (controller.signal.aborted) return;
      replaceMessages = true;
      void connectYoutubeLiveChat(videoUrl, controller.signal, (event) => {
        if (event.type === "ended") {
          flush();
          setStatus("ended");
          controller.abort();
          return;
        }
        if (event.type === "connected") {
          setStatus("connected");
          return;
        }
        pending.push(event.message);
        if (pending.length > MAX_MESSAGES) pending = pending.slice(-MAX_MESSAGES);
        if (frame === undefined) frame = window.requestAnimationFrame(flush);
      })
        .then(() => recover(new Error("Live chat stream closed")))
        .catch(recover);
    };
    timer = window.setTimeout(connect, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      pending = [];
    };
  }, [ended, retryCount, videoUrl]);
  return { messages, status, retry: () => setRetryCount((count) => count + 1) };
}
