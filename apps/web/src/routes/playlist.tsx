import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlaylistActions } from "../components/playlist-actions";
import { PublicPlaylistHeader } from "../components/public-playlist-header";
import { ScrollSentinel } from "../components/scroll-sentinel";
import { Toast } from "../components/toast";
import { VideoGrid } from "../components/video-grid";
import { VideoGridSkeleton } from "../components/video-grid-skeleton";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { usePublicPlaylist } from "../hooks/use-public-playlist";
import { useSavedPlaylists } from "../hooks/use-saved-playlists";
import { randomShuffleSeed, shuffleByKey } from "../lib/playlist-shuffle";
import { playlistListId } from "../lib/playlist-url";
import { deriveSectionsFromVideos } from "../lib/stream-collections";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";

function PublicPlaylistPage() {
  const { list, url } = Route.useSearch();
  const playlistUrl = url || (list ? `https://www.youtube.com/playlist?list=${list}` : "");
  const listId = list || playlistListId(playlistUrl) || undefined;
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePublicPlaylist(playlistUrl);
  const savedPlaylists = useSavedPlaylists();
  const { filter } = useBlockedFilter();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const saved = savedPlaylists.findSaved(playlistUrl);
  const streams = useMemo(
    () => filter((data?.pages ?? []).flatMap((p) => p.streams)),
    [filter, data],
  );

  const sections = useMemo(() => {
    return deriveSectionsFromVideos(streams.map((s) => ({ url: s.id, title: s.title })));
  }, [streams]);

  const activeSection = sections?.find((sec) => sec.id === activeSectionId);
  const visibleStreams = activeSection
    ? streams.filter((s) => activeSection.videoUrls.includes(s.id.trim()))
    : streams;

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
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-2 text-center">
        <p className="text-fg-muted text-sm">{m.ui_this_playlist_could_not_be_loaded()}</p>
        <Link to="/" className="text-xs text-fg-soft hover:text-fg-muted transition-colors">
          {m.ui_back_home()}
        </Link>
      </div>
    );
  }

  const info = data.pages[0]?.playlist;
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
    if (saved) {
      savedPlaylists.remove.mutate(saved.id, {
        onSuccess: () => setToast(m.ui_collection_unsubscribed()),
      });
      return;
    }
    savedPlaylists.save.mutate(playlistUrl, {
      onSuccess: () => setToast(m.ui_collection_subscribed()),
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4 [animation:page-fade-in_0.2s_ease-out]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            to="/playlists"
            className="mt-1 text-fg-soft transition-colors hover:text-fg"
            aria-label={m.ui_back_to_playlists()}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          {info && <PublicPlaylistHeader info={info} />}
        </div>
        {streams.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <PlaylistActions
              onPlayAll={() => playFrom(visibleStreams[0]?.id ?? streams[0]?.id)}
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
                <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
              {saved ? m.ui_subscribed_collection() : m.ui_subscribe_collection()}
            </button>
          </div>
        )}
      </div>
      {sections && sections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSectionId(null)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSectionId === null
                ? "bg-fg text-app"
                : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
            }`}
          >
            <span>{m.ui_all()}</span>
            <span
              className={`text-[10px] ${activeSectionId === null ? "opacity-80" : "text-fg-soft"}`}
            >
              ({streams.length})
            </span>
          </button>
          {sections.map((section) => {
            const isSelected = activeSectionId === section.id;
            const secCount = streams.filter((s) => section.videoUrls.includes(s.id.trim())).length;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-fg text-app"
                    : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
                }`}
              >
                <span>{section.title}</span>
                <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-fg-soft"}`}>
                  ({secCount})
                </span>
              </button>
            );
          })}
        </div>
      )}
      {streams.length === 0 ? (
        <p className="text-fg-muted text-sm">{m.ui_this_playlist_has_no_videos()}</p>
      ) : (
        <VideoGrid streams={visibleStreams} listId={listId} />
      )}
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="public-playlist-next" />}
      <ScrollSentinel onIntersect={loadMore} enabled={!!hasNextPage && !isFetchingNextPage} />
      <Toast message={toast} />
    </div>
  );
}

export const Route = createFileRoute("/playlist")({
  validateSearch: (search: Record<string, unknown>) => ({
    list: typeof search.list === "string" && search.list.length > 0 ? search.list : undefined,
    url: typeof search.url === "string" && search.url.length > 0 ? search.url : undefined,
  }),
  component: PublicPlaylistPage,
});
