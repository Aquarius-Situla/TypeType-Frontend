import { useMemo, useState } from "react";
import { useChannelPlaylists } from "../hooks/use-channel-playlists";
import { m } from "../paraglide/messages.js";
import type { PublicPlaylistInfo } from "../types/playlist";
import { PageSpinner } from "./page-spinner";
import { PublicPlaylistCard } from "./public-playlist-card";
import { ScrollSentinel } from "./scroll-sentinel";

type Props = {
  channelUrl: string;
};

type SubFilter = "all" | "collection" | "series";

function getPlaylistCategory(pl: PublicPlaylistInfo): "collection" | "series" | "normal" {
  if (pl.playlistType === "collection" || pl.url.includes("business=space_collection")) {
    return "collection";
  }
  if (pl.playlistType === "series" || pl.url.includes("business=space_series")) {
    return "series";
  }
  return "normal";
}

export function ChannelPlaylistsSection({ channelUrl }: Props) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChannelPlaylists(channelUrl);
  const playlists = (data?.pages.flatMap((p) => p.playlists) ?? []).filter(
    (pl, i, arr) => arr.findIndex((x) => x.url === pl.url) === i,
  );

  const [subFilter, setSubFilter] = useState<SubFilter>("all");

  const { collectionsCount, seriesCount } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const pl of playlists) {
      const cat = getPlaylistCategory(pl);
      if (cat === "collection") c++;
      else if (cat === "series") s++;
    }
    return { collectionsCount: c, seriesCount: s };
  }, [playlists]);

  const hasCategorizedPlaylists = collectionsCount > 0 || seriesCount > 0;

  const filteredPlaylists = useMemo(() => {
    if (!hasCategorizedPlaylists || subFilter === "all") return playlists;
    return playlists.filter((pl) => getPlaylistCategory(pl) === subFilter);
  }, [playlists, subFilter, hasCategorizedPlaylists]);

  if (isLoading) return <PageSpinner />;
  if (playlists.length === 0) {
    return <p className="text-fg-muted text-sm">{m.ui_no_playlists_on_this_channel()}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {hasCategorizedPlaylists && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSubFilter("all")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              subFilter === "all"
                ? "bg-fg text-app"
                : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
            }`}
          >
            <span>{m.ui_all()}</span>
            <span
              className={`text-[10px] ${subFilter === "all" ? "opacity-80" : "text-fg-soft"}`}
            >
              ({playlists.length})
            </span>
          </button>
          {collectionsCount > 0 && (
            <button
              type="button"
              onClick={() => setSubFilter("collection")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                subFilter === "collection"
                  ? "bg-fg text-app"
                  : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
              }`}
            >
              <span>{m.ui_collection()}</span>
              <span
                className={`text-[10px] ${subFilter === "collection" ? "opacity-80" : "text-fg-soft"}`}
              >
                ({collectionsCount})
              </span>
            </button>
          )}
          {seriesCount > 0 && (
            <button
              type="button"
              onClick={() => setSubFilter("series")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                subFilter === "series"
                  ? "bg-fg text-app"
                  : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
              }`}
            >
              <span>{m.ui_series()}</span>
              <span
                className={`text-[10px] ${subFilter === "series" ? "opacity-80" : "text-fg-soft"}`}
              >
                ({seriesCount})
              </span>
            </button>
          )}
        </div>
      )}

      {filteredPlaylists.length === 0 ? (
        <p className="text-fg-muted text-sm">{m.ui_no_playlists_on_this_channel()}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPlaylists.map((pl) => (
            <PublicPlaylistCard key={pl.url} playlist={pl} />
          ))}
        </div>
      )}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </div>
  );
}
