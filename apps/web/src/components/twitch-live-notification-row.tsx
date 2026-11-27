import { Link } from "@tanstack/react-router";
import { siTwitch } from "simple-icons";
import { useClientLocale } from "../hooks/use-client-locale";
import { formatPublishedDate } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { TwitchLiveStartedNotification } from "../types/notifications";
import { ServiceIcon } from "./service-icon";

type Props = {
  item: TwitchLiveStartedNotification;
  onOpen: () => void;
};

export function TwitchLiveNotificationRow({ item, onOpen }: Props) {
  const locale = useClientLocale();
  const startedText =
    formatPublishedDate(item.publishedAt ?? item.createdAt, undefined, locale) || m.ui_recent();

  return (
    <Link
      to="/twitch/watch"
      search={{ c: item.live.login }}
      className="grid grid-cols-[96px_1fr] gap-3 rounded-lg px-2 py-2 hover:bg-surface-strong [animation:card-pop-in_0.24s_ease-out]"
      onClick={onOpen}
    >
      <div className="flex h-[54px] w-24 items-center justify-center rounded bg-surface-soft">
        {item.channelAvatarUrl ? (
          <img
            src={proxyImage(item.channelAvatarUrl)}
            alt={item.channelName}
            className="h-10 w-10 rounded-full ring-2 ring-[#9146ff]"
            loading="lazy"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-[#9146ff]">
            <ServiceIcon path={siTwitch.path} color="#9146ff" label="Twitch" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight text-fg">
          {m.notification_twitch_live({ name: item.channelName })}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{item.title}</p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-fg-soft">
          <ServiceIcon path={siTwitch.path} color="#9146ff" label="Twitch" />
          {item.live.category && <span className="truncate">{item.live.category}</span>}
          <span className="shrink-0 text-xs">{startedText}</span>
        </div>
      </div>
    </Link>
  );
}
