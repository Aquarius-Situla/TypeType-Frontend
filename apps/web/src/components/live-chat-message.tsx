import { ShieldCheck, UserRound } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import type { LiveChatMessage as Message } from "../lib/api-live-chat";
import { liveChatAuthorColor, liveChatAvatarUrl } from "../lib/live-chat-author";
import { m } from "../paraglide/messages.js";

export function LiveChatMessage({
  message,
  compact,
  timestamps,
}: {
  message: Message;
  compact: boolean;
  timestamps: boolean;
}) {
  const { locale } = useInterfaceLocale();
  const name = message.authorName?.trim();
  const color = name ? liveChatAuthorColor(name) : "#96969f";
  const avatar = liveChatAvatarUrl(message.authorAvatarUrl);
  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 hover:bg-white/[0.04] ${compact ? "py-0.5 text-[13px]" : "py-1.5 text-sm"} leading-[1.5]`}
    >
      <time
        dateTime={new Date(message.receivedAtMs).toISOString()}
        className={timestamps ? "shrink-0 pt-0.5 text-[10px] text-white/40" : "sr-only"}
      >
        {new Date(message.receivedAtMs).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
      <div
        aria-hidden="true"
        className={`relative mt-0.5 shrink-0 overflow-hidden rounded-full ${compact ? "size-5" : "size-[25px]"}`}
        style={{ color, backgroundColor: `${color}22` }}
      >
        <span className="flex size-full items-center justify-center text-[11px] font-semibold">
          {name ? Array.from(name)[0] : <UserRound size={12} />}
        </span>
        {avatar && (
          <img
            src={avatar}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
      </div>
      <div className="min-w-0 [overflow-wrap:anywhere]">
        {name && (
          <strong
            className={`mr-1.5 font-semibold ${compact ? "text-xs" : "text-[13px]"}`}
            style={{ color }}
          >
            {message.moderator && (
              <span title={m.watch_live_chat_moderator({}, { locale })}>
                <ShieldCheck className="mr-1 inline-block align-[-2px]" size={12} />
                <span className="sr-only">{m.watch_live_chat_moderator({}, { locale })} </span>
              </span>
            )}
            {name}
          </strong>
        )}
        <span className="whitespace-pre-wrap">{message.text}</span>
      </div>
    </div>
  );
}
