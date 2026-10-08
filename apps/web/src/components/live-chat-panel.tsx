import { RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { connectYoutubeLiveChat, type LiveChatMessage } from "../lib/api-live-chat";
import { debugConsole } from "../lib/debug-console";
import { m } from "../paraglide/messages.js";

type Props = {
  videoUrl: string;
  ended: boolean;
  className?: string;
  onClose: () => void;
};

type Status = "connecting" | "connected" | "error" | "ended";
const MAX_MESSAGES = 200;

export function LiveChatPanel({ videoUrl, ended, className = "", onClose }: Props) {
  const { locale } = useInterfaceLocale();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [status, setStatus] = useState<Status>(ended ? "ended" : "connecting");
  const [retryCount, setRetryCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (ended) {
      setStatus("ended");
      return;
    }
    const controller = new AbortController();
    setMessages([]);
    setStatus("connecting");
    const retryDelayMs = Math.min(retryCount * 500, 3_000);
    const timer = window.setTimeout(() => {
      void connectYoutubeLiveChat(videoUrl, controller.signal, (event) => {
        if (event.type === "ended") {
          setStatus("ended");
          controller.abort();
          return;
        }
        setStatus("connected");
        if (event.type === "connected") return;
        setMessages((current) => [...current, event.message].slice(-MAX_MESSAGES));
      })
        .then(() => {
          if (!controller.signal.aborted) setStatus("error");
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted)
            debugConsole("live_chat.error", {
              message: error instanceof Error ? error.message : String(error),
            });
          if (!controller.signal.aborted) setStatus("error");
        });
    }, retryDelayMs);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ended, retryCount, videoUrl]);

  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (lastMessageId && stickToBottom.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [lastMessageId]);

  const title = m.watch_live_chat({}, { locale });
  return (
    <section
      aria-label={title}
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f] text-white shadow-none ${className}`}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-2 shrink-0 rounded-full ${status === "connected" ? "bg-red-500" : "bg-white/30"}`}
          />
          <h2 className="truncate text-base font-semibold text-white">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={m.watch_live_chat_close({}, { locale })}
          title={m.watch_live_chat_close({}, { locale })}
          className="flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      {status === "ended" && (
        <p className="shrink-0 border-b border-white/10 px-3 py-2 text-xs text-white/55">
          {m.watch_live_chat_ended({}, { locale })}
        </p>
      )}
      {status === "error" && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
          <p className="text-xs text-white/55">{m.watch_live_chat_error({}, { locale })}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-xs text-white hover:bg-white/10"
          >
            <RefreshCw size={14} aria-hidden="true" />
            {m.watch_live_chat_retry({}, { locale })}
          </button>
        </div>
      )}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto py-2"
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottom.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 48;
        }}
      >
        {status === "connecting" && messages.length === 0 && (
          <p className="px-3 py-4 text-xs text-white/50">
            {m.watch_live_chat_connecting({}, { locale })}
          </p>
        )}
        {status === "connected" && messages.length === 0 && (
          <p className="px-3 py-4 text-xs text-white/50">
            {m.watch_live_chat_empty({}, { locale })}
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className="px-4 py-1 text-sm leading-5 text-white/90 hover:bg-white/[0.04]"
          >
            <time dateTime={new Date(message.receivedAtMs).toISOString()} className="sr-only">
              {new Date(message.receivedAtMs).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span className="break-words">{message.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
