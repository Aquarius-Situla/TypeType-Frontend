import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaylistActions } from "../components/playlist-actions";
import { PlaylistSectionTabs } from "../components/playlist-section-tabs";
import { PublicPlaylistHeader } from "../components/public-playlist-header";
import { ScrollSentinel } from "../components/scroll-sentinel";
import { Toast } from "../components/toast";
import { VideoGrid } from "../components/video-grid";
import { VideoGridSkeleton } from "../components/video-grid-skeleton";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { usePlaylistCollectionMeta } from "../hooks/use-playlist-collection-meta";
import { usePublicPlaylist } from "../hooks/use-public-playlist";
import { useSavedPlaylists } from "../hooks/use-saved-playlists";
import { useScopedValue } from "../hooks/use-scoped-value";
import { isBilibiliCollectionUrl } from "../lib/api-bilibili-channel-collections";
import { randomShuffleSeed, shuffleByKey } from "../lib/playlist-shuffle";
import { playlistListId, youtubePlaylistId } from "../lib/playlist-url";
import {
  buildLoadedStreamParamSet,
  isPublicBilibiliCollection,
  resolvePublicPlaylistStreams,
  shouldEnablePublicPlaylistPagination,
} from "../lib/public-playlist-view";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";

function PublicPlaylistPage() {
  const { list, url } = Route.useSearch();
  const playlistUrl =
    url ||
    (list
      ? list.startsWith("http") || isBilibiliCollectionUrl(list)
        ? list
        : `https://www.youtube.com/playlist?list=${list}`
      : "");
  const listId =
    list ||
    playlistListId(playlistUrl) ||
    (isBilibiliCollectionUrl(playlistUrl) ? playlistUrl : undefined);
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
  } = usePublicPlaylist(playlistUrl);
  const savedPlaylists = useSavedPlaylists();
  const { filter } = useBlockedFilter();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const saved = savedPlaylists.findSaved(playlistUrl);
  const rawStreams = useMemo(() => (data?.pages ?? []).flatMap((p) => p.streams), [data]);
  const streams = useMemo(() => filter(rawStreams), [filter, rawStreams]);
  const loadedStreamParams = useMemo(() => buildLoadedStreamParamSet(rawStreams), [rawStreams]);

  const info = data?.pages[0]?.playlist;
  const isCollection = isPublicBilibiliCollection(playlistUrl, info?.playlistType);

  const [activeSectionId, setActiveSectionId] = useScopedValue<string | null>(playlistUrl, null);
  const collectionMeta = usePlaylistCollectionMeta(
    playlistUrl,
    isCollection,
    info?.title ?? "",
    rawStreams,
    info?.streamCount,
  );
  const sections =
    isCollection && collectionMeta?.sections && collectionMeta.sections.length > 1
      ? collectionMeta.sections
      : undefined;
  const activeSection = sections?.find((sec) => sec.id === activeSectionId);

  const visibleStreams = useMemo(
    () =>
      resolvePublicPlaylistStreams({
        streams,
        activeSection,
        info,
        filter,
      }),
    [streams, activeSection, info, filter],
  );

  const totalEpisodesCount = useMemo(() => {
    if (info?.streamCount && info.streamCount > 0) return info.streamCount;
    if (sections && sections.length > 0) {
      return sections.reduce((acc, s) => acc + (s.episodes?.length ?? s.videoUrls.length), 0);
    }
    return streams.length;
  }, [info?.streamCount, sections, streams.length]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!playlistUrl) return <p className="text-fg-muted text-sm">{m.ui_no_playlist_selected()}</p>;
  if (isLoading) return <VideoGridSkeleton idPrefix="public-playlist" />;
  if ((isError && !data) || (!isLoading && !data)) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-2 text-center">
        <p className="text-fg-muted text-sm">{m.ui_this_playlist_could_not_be_loaded()}</p>
        <Link to="/" className="text-xs text-fg-soft hover:text-fg-muted transition-colors">
          {m.ui_back_home()}
        </Link>
      </div>
    );
  }

  function playFrom(url: string | undefined, shuffle?: string) {
    if (!url) return;
    markWatchAutoplayIntent();
    navigate({
      to: "/watch",
      search: {
        v: toPublicWatchParam(url),
        ...(listId ? { list: listId } : {}),
        ...(shuffle ? { shuffle } : {}),
      },
    });
  }

  function toggleSaved() {
    const handleErr = (err: unknown) =>
      setToast(err instanceof Error ? err.message : m.ui_failed());
    if (saved) {
      savedPlaylists.remove.mutate(saved.id, {
        onSuccess: () => setToast(m.ui_playlist_removed()),
        onError: handleErr,
      });
      return;
    }
    savedPlaylists.save.mutate(info ? { url: playlistUrl, info } : playlistUrl, {
      onSuccess: () => setToast(m.ui_playlist_saved()),
      onError: handleErr,
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4 [animation:page-fade-in_0.2s_ease-out]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {info && <PublicPlaylistHeader info={info} />}
        {streams.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <PlaylistActions
              onPlayAll={() => playFrom(visibleStreams[0]?.id)}
              onShuffle={() => {
                const seed = randomShuffleSeed();
                playFrom(shuffleByKey(visibleStreams, seed)[0]?.id, seed);
              }}
            />
            <button
              type="button"
              onClick={toggleSaved}
              disabled={savedPlaylists.save.isPending || savedPlaylists.remove.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 font-medium text-fg text-xs transition-colors hover:bg-surface-strong disabled:opacity-50"
            >
              {saved ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
              {saved ? m.ui_saved() : m.ui_save()}
            </button>
          </div>
        )}
      </div>

      {sections && (
        <PlaylistSectionTabs
          sections={sections}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
          totalCount={totalEpisodesCount}
        />
      )}

      {visibleStreams.length === 0 ? (
        <p className="text-fg-muted text-sm">{m.ui_this_playlist_has_no_videos()}</p>
      ) : (
        <VideoGrid streams={visibleStreams} listId={listId} />
      )}
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="public-playlist-next" />}
      {isFetchNextPageError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-3 py-4 text-fg-muted text-sm"
        >
          <p>{m.subscriptions_feed_next_page_error()}</p>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-h-9 rounded-lg border border-border-strong px-3 text-fg text-xs transition-colors hover:bg-surface-strong disabled:opacity-40"
          >
            {m.ui_retry()}
          </button>
        </div>
      )}
      <ScrollSentinel
        onIntersect={loadMore}
        enabled={shouldEnablePublicPlaylistPagination({
          activeSection,
          loadedStreamParams,
          hasNextPage,
          isFetchingNextPage,
          isFetchNextPageError,
        })}
      />
      <Toast message={toast} />
    </div>
  );
}

export const Route = createFileRoute("/playlist")({
  validateSearch: (search: Record<string, unknown>) => ({
    list: typeof search.list === "string" && search.list.length > 0 ? search.list : undefined,
    url: typeof search.url === "string" && search.url.length > 0 ? search.url : undefined,
  }),
  beforeLoad: ({ search }) => {
    const list = search.url ? youtubePlaylistId(search.url) : null;
    if (list) throw redirect({ to: "/playlist", search: { list, url: undefined }, replace: true });
  },
  component: PublicPlaylistPage,
});
