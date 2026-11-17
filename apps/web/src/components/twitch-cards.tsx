import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { formatDuration, formatPublishedDate, formatViews } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type {
  TwitchClip,
  TwitchGame,
  TwitchStream,
  TwitchUser,
  TwitchVideo,
} from "../types/twitch";

type WatchSearch = { c?: string; v?: string; clip?: string };

function Thumb({ src, children }: { src: string; children?: ReactNode }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-strong sm:rounded-lg">
      {src && (
        <img
          src={proxyImage(src, "card")}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      )}
      {children}
    </div>
  );
}

function Owner({ user, detail }: { user: TwitchUser; detail: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1 text-fg-muted text-xs">
      <Link
        to="/twitch/channel/$login"
        params={{ login: user.login }}
        className="w-fit truncate transition-colors hover:text-fg"
      >
        {user.displayName || user.login}
      </Link>
      {detail && <span className="truncate text-fg-soft">· {detail}</span>}
    </div>
  );
}

function Card({
  search,
  thumb,
  title,
  footer,
}: {
  search: WatchSearch;
  thumb: ReactNode;
  title: string;
  footer: ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-2">
      <Link to="/twitch/watch" search={search} className="block" aria-label={title}>
        {thumb}
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5 px-1 sm:px-0">
        <Link
          to="/twitch/watch"
          search={search}
          className="line-clamp-2 font-medium text-fg text-sm leading-snug hover:text-fg-strong"
        >
          {title}
        </Link>
        {footer}
      </div>
    </div>
  );
}

export function TwitchStreamCard({ stream }: { stream: TwitchStream }) {
  return (
    <Card
      search={{ c: stream.user.login }}
      title={stream.title || stream.user.displayName}
      thumb={
        <Thumb src={stream.previewUrl}>
          <span className="absolute top-2 left-2 rounded bg-red-600 px-1.5 py-0.5 font-semibold text-[11px] text-white uppercase">
            {m.ui_live()}
          </span>
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 text-white text-xs">
            {m.twitch_viewers({ count: stream.viewers.toLocaleString() })}
          </span>
        </Thumb>
      }
      footer={<Owner user={stream.user} detail={stream.game?.name ?? ""} />}
    />
  );
}

export function TwitchVideoCard({ video }: { video: TwitchVideo }) {
  const { locale } = useInterfaceLocale();
  return (
    <Card
      search={{ v: video.id }}
      title={video.title}
      thumb={
        <Thumb src={video.previewUrl}>
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 text-white text-xs">
            {formatDuration(video.lengthSeconds)}
          </span>
        </Thumb>
      }
      footer={
        <Owner
          user={video.owner}
          detail={`${formatViews(video.views)} · ${formatPublishedDate(Date.parse(video.createdAt), undefined, locale)}`}
        />
      }
    />
  );
}

export function TwitchClipCard({ clip }: { clip: TwitchClip }) {
  return (
    <Card
      search={{ clip: clip.slug }}
      title={clip.title}
      thumb={
        <Thumb src={clip.thumbnailUrl}>
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 text-white text-xs">
            {formatDuration(Math.round(clip.durationSeconds))}
          </span>
        </Thumb>
      }
      footer={<Owner user={clip.broadcaster} detail={formatViews(clip.views)} />}
    />
  );
}

export function TwitchGameCard({ game }: { game: TwitchGame }) {
  return (
    <Link
      to="/twitch/category/$slug"
      params={{ slug: game.slug }}
      className="group flex w-28 flex-shrink-0 flex-col gap-1.5 sm:w-32"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-surface-strong">
        {game.boxArtUrl && (
          <img
            src={proxyImage(game.boxArtUrl, "card")}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        )}
      </div>
      <span className="line-clamp-2 font-medium text-fg text-xs">{game.name}</span>
      {game.viewers != null && game.viewers > 0 && (
        <span className="text-fg-muted text-[11px]">
          {m.twitch_viewers({ count: game.viewers.toLocaleString() })}
        </span>
      )}
    </Link>
  );
}
