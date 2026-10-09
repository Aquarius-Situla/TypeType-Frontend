import { ArrowDown, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useLiveChatConnection } from "../hooks/use-live-chat-connection";
import { m } from "../paraglide/messages.js";
import { LiveChatMessage } from "./live-chat-message";
import { LiveChatOptions } from "./live-chat-options";

type Props = { videoUrl: string; ended: boolean; className?: string; onClose: () => void };

export function LiveChatPanel({ videoUrl, ended, className = "", onClose }: Props) {
  const { locale } = useInterfaceLocale();
  const { messages, status, retry } = useLiveChatConnection(videoUrl, ended);
  const [compact, setCompact] = useState(false);
  const [timestamps, setTimestamps] = useState(false);
  const [following, setFollowing] = useState(true);
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    if (lastId && stick.current && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [lastId]);
  useEffect(() => {
    if (!videoUrl) return;
    stick.current = true;
    setFollowing(true);
  }, [videoUrl]);
  const jump = () => {
    if (!videoUrl) return;
    stick.current = true;
    setFollowing(true);
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  };
  const title = m.watch_live_chat({}, { locale });
  const stateText =
    status === "error"
      ? m.watch_live_chat_error({}, { locale })
      : status === "ended"
        ? m.watch_live_chat_ended({}, { locale })
        : status === "connecting"
          ? m.watch_live_chat_connecting({}, { locale })
          : m.watch_live_chat_empty({}, { locale });
  return (
    <section
      aria-label={title}
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#18181b] text-white ${className}`}
    >
      <header className="flex h-[53px] shrink-0 items-center justify-between border-b border-white/10 bg-[#151518] px-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`size-1.5 shrink-0 rounded-full ${status === "connected" ? "bg-red-400" : "bg-white/30"}`}
          />
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <LiveChatOptions
            compact={compact}
            timestamps={timestamps}
            onCompact={setCompact}
            onTimestamps={setTimestamps}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={m.watch_live_chat_close({}, { locale })}
            title={m.watch_live_chat_close({}, { locale })}
            className="flex size-8 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-3.5 py-2.5 text-[11px] text-white/45">
        <span>{m.watch_live_chat_messages({}, { locale })}</span>
      </div>
      <div
        ref={list}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto py-2"
        onScroll={(event) => {
          const element = event.currentTarget;
          stick.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
          setFollowing(stick.current);
        }}
      >
        {messages.map((message) => (
          <LiveChatMessage
            key={message.id}
            message={message}
            compact={compact}
            timestamps={timestamps}
          />
        ))}
        {(messages.length === 0 || status === "error" || status === "ended") && (
          <div className="flex flex-col items-center gap-3 px-5 py-8 text-center text-xs text-white/50">
            <p>{stateText}</p>
            {status === "error" && (
              <button
                type="button"
                onClick={() => {
                  jump();
                  retry();
                }}
                className="inline-flex items-center gap-2 rounded px-3 py-2 text-white hover:bg-white/10"
              >
                <RefreshCw size={14} />
                {m.watch_live_chat_retry({}, { locale })}
              </button>
            )}
          </div>
        )}
      </div>
      {!following && (
        <button
          type="button"
          onClick={jump}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded border border-white/15 bg-[#303036] px-3 py-2 text-xs shadow-lg hover:bg-[#3a3a42]"
        >
          <ArrowDown size={14} />
          {m.watch_live_chat_latest({}, { locale })}
        </button>
      )}
    </section>
  );
}
