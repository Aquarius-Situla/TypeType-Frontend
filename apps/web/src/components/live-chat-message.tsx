import { ShieldCheck } from "lucide-react";
import { memo } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import type { LiveChatMessage as Message } from "../lib/api-live-chat";
import { liveChatAuthorColor, liveChatAvatarUrl } from "../lib/live-chat-author";
import { m } from "../paraglide/messages.js";
import { LiveChatAvatar } from "./live-chat-avatar";

export const LiveChatMessage = memo(function LiveChatMessage({
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
      <LiveChatAvatar key={avatar ?? ""} url={avatar} name={name} color={color} compact={compact} />
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
});
