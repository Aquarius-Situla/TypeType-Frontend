import { useEffect, useState } from "react";
import { connectYoutubeLiveChat, type LiveChatMessage } from "../lib/api-live-chat";
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
    setMessages([]);
    setStatus("connecting");
    const timer = window.setTimeout(
      () => {
        void connectYoutubeLiveChat(videoUrl, controller.signal, (event) => {
          if (event.type === "ended") {
            setStatus("ended");
            controller.abort();
            return;
          }
          setStatus("connected");
          if (event.type === "message") {
            setMessages((current) => [...current, event.message].slice(-MAX_MESSAGES));
          }
        })
          .then(() => {
            if (!controller.signal.aborted) setStatus("error");
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return;
            debugConsole("live_chat.error", {
              message: error instanceof Error ? error.message : String(error),
            });
            setStatus("error");
          });
      },
      Math.min(retryCount * 500, 3000),
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ended, retryCount, videoUrl]);
  return { messages, status, retry: () => setRetryCount((count) => count + 1) };
}
