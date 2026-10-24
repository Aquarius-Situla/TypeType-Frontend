import { Link } from "@tanstack/react-router";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { PublicPlaylistInfo } from "../types/playlist";

type Props = {
  playlist: PublicPlaylistInfo;
};

export function PublicPlaylistCard({ playlist }: Props) {
  const count =
    playlist.streamCount === 1
      ? m.ui_video_count({ count: playlist.streamCount })
      : m.ui_videos_count({ count: playlist.streamCount });

  const isCollection =
    playlist.playlistType === "collection" ||
    playlist.url.includes("business=space_collection");
  const isSeries =
    playlist.playlistType === "series" ||
    playlist.url.includes("business=space_series");

  return (
    <Link
      to="/playlist"
      search={{ list: undefined, url: playlist.url }}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-strong">
        <img
          src={proxyImage(playlist.thumbnailUrl)}
          alt={playlist.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {isCollection && (
          <div className="absolute top-1.5 left-1.5 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-xs">
            {m.ui_collection()}
          </div>
        )}
        {isSeries && (
          <div className="absolute top-1.5 left-1.5 rounded-md bg-sky-600/90 dark:bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-xs">
            {m.ui_series()}
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
          {count}
        </div>
      </div>
      <div className="min-w-0 px-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-fg group-hover:text-fg-strong">
          {playlist.title}
        </p>
        <p className="mt-1 truncate text-xs text-fg-muted">{playlist.uploaderName}</p>
      </div>
    </Link>
  );
}
