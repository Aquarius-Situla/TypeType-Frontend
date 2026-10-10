import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookmarkCheck, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "../components/confirm-modal";
import { PlaylistActions } from "../components/playlist-actions";
import { PlaylistGrid } from "../components/playlist-grid";
import { PlaylistRenameModal } from "../components/playlist-rename-modal";
import { PlaylistSortMenu } from "../components/playlist-sort-menu";
import { PublicPlaylistHeader } from "../components/public-playlist-header";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { usePlaylist } from "../hooks/use-playlist";
import { usePlaylists } from "../hooks/use-playlists";
import { randomShuffleSeed, shuffleByKey } from "../lib/playlist-shuffle";
import { deduplicateVideos, type PlaylistSortMode, sortPlaylistVideos } from "../lib/playlist-sort";
import {
  deriveSectionsFromVideos,
  ensureCollectionMetadata,
  extractCollectionOriginalTitle,
  getSubscribedCollectionMeta,
  isCollectionPlaylist,
  removeSubscribedCollectionId,
  type SubscribedCollectionMeta,
  saveSubscribedCollectionMeta,
} from "../lib/stream-collections";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { PublicPlaylistInfo } from "../types/playlist";
import type { PlaylistVideoItem } from "../types/user";

function PlaylistDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { remove, removeVideo, rename, reorder } = usePlaylists();
  const { filter } = useBlockedFilter();
  const { data: playlist, isPending } = usePlaylist(id);
  const [renaming, setRenaming] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PlaylistVideoItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [sortMode, setSortMode] = useState<PlaylistSortMode>("manual");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const isCollection = Boolean(playlist && isCollectionPlaylist(playlist));
  const [collectionMeta, setCollectionMeta] = useState<SubscribedCollectionMeta | undefined>(() =>
    getSubscribedCollectionMeta(id),
  );

  useEffect(() => {
    if (isCollection && playlist) {
      void ensureCollectionMetadata(id, playlist.name, playlist.videos ?? []).then((meta) => {
        if (meta) setCollectionMeta(meta);
      });
    }
  }, [isCollection, id, playlist]);

  const rawVideos = useMemo(() => {
    if (!playlist) return [];
    const plVideos = playlist.videos ?? [];
    if (!isCollection || !collectionMeta?.sections || collectionMeta.sections.length === 0) {
      return plVideos;
    }
    const metaEpisodes = collectionMeta.sections.flatMap((sec) => sec.episodes ?? []);
    if (metaEpisodes.length === 0) return plVideos;

    const seenUrls = new Set<string>();
    const combined: PlaylistVideoItem[] = [];

    for (const v of plVideos) {
      const u = v.url.trim();
      if (!u || seenUrls.has(u)) continue;
      seenUrls.add(u);
      combined.push(v);
    }
    for (const ep of metaEpisodes) {
      const u = ep.url.trim();
      if (!u || seenUrls.has(u)) continue;
      seenUrls.add(u);
      combined.push({
        id: ep.videoId || u,
        url: u,
        title: ep.title,
        thumbnail: ep.thumbnailUrl ?? "",
        channelName: ep.channelName ?? plVideos[0]?.channelName ?? "",
        channelUrl: plVideos[0]?.channelUrl ?? "",
        channelAvatar: plVideos[0]?.channelAvatar ?? "",
        viewCount: 0,
        duration: 0,
        position: combined.length,
        watchPosition: 0,
        watched: false,
        progressUpdatedAt: 0,
      });
    }
    return combined;
  }, [playlist, isCollection, collectionMeta]);
  const allVideos = isCollection ? deduplicateVideos(rawVideos) : rawVideos;
  const sections =
    collectionMeta?.sections && collectionMeta.sections.length > 1
      ? collectionMeta.sections
      : isCollection
        ? deriveSectionsFromVideos(allVideos)
        : undefined;

  // If a section is selected, filter videos to that section's video URLs
  const activeSection = sections?.find((sec) => sec.id === activeSectionId);
  const sectionFilteredVideos = activeSection
    ? allVideos.filter((v: PlaylistVideoItem) => activeSection.videoUrls.includes(v.url.trim()))
    : allVideos;

  const videos = filter(sectionFilteredVideos) as PlaylistVideoItem[];
  const count = videos.length;
  const sortedVideos = sortPlaylistVideos(videos, sortMode, isCollection);
  const reorderable = !isCollection && sortMode === "manual";

  const headerInfo = useMemo<PublicPlaylistInfo | null>(() => {
    if (!playlist || !isCollection) return null;
    const headerThumbnail =
      allVideos[0]?.thumbnail ||
      collectionMeta?.sections?.[0]?.episodes?.[0]?.thumbnailUrl ||
      playlist.videos?.[0]?.thumbnail;
    const headerUploader =
      allVideos[0]?.channelName ||
      collectionMeta?.sections?.[0]?.episodes?.[0]?.channelName ||
      playlist.videos?.[0]?.channelName;

    return {
      id,
      title: playlist.name,
      url: `/playlists/${id}`,
      streamCount: allVideos.length,
      thumbnailUrl: headerThumbnail ?? "",
      uploaderName: headerUploader ?? "",
      playlistType: "collection",
    };
  }, [playlist, isCollection, allVideos, collectionMeta, id]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-fg-soft text-sm">{m.ui_loading()}</p>
      </div>
    );
  }
  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-32 text-center">
        <p className="text-fg-muted text-sm">{m.ui_playlist_not_found()}</p>
        <Link
          to="/playlists"
          className="text-fg-soft text-xs transition-colors hover:text-fg-muted"
        >
          {m.ui_back_to_playlists()}
        </Link>
      </div>
    );
  }

  function handleDelete() {
    remove.mutate(id);
    if (isCollection) {
      removeSubscribedCollectionId(id);
    }
    navigate({ to: "/playlists" });
  }
  function playFrom(video: PlaylistVideoItem | undefined, shuffle?: string) {
    if (!video) return;
    markWatchAutoplayIntent();
    navigate({
      to: "/watch",
      search: { v: toPublicWatchParam(video.url), list: id, ...(shuffle ? { shuffle } : {}) },
    });
  }
  function handleShuffle() {
    const seed = randomShuffleSeed();
    playFrom(shuffleByKey(sortedVideos, seed)[0] as PlaylistVideoItem | undefined, seed);
  }

  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4 [animation:page-fade-in_0.2s_ease-out]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {isCollection && headerInfo ? (
          <div className="flex items-start gap-3">
            <Link
              to="/playlists"
              className="mt-1 text-fg-soft transition-colors hover:text-fg"
              aria-label={m.ui_back_to_playlists()}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <PublicPlaylistHeader info={headerInfo} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/playlists"
              className="text-fg-soft transition-colors hover:text-fg"
              aria-label={m.ui_back_to_playlists()}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-fg text-lg">{playlist.name}</h1>
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="text-fg-soft transition-colors hover:text-fg-muted"
                  aria-label={m.ui_rename_playlist()}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-fg-soft text-xs">
                {count === 1 ? m.ui_video_count({ count }) : m.ui_videos_count({ count })}
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {count > 0 && (
            <>
              <PlaylistActions
                onPlayAll={() => playFrom(sortedVideos[0])}
                onShuffle={handleShuffle}
              />
              <PlaylistSortMenu value={sortMode} onChange={setSortMode} />
            </>
          )}
          {isCollection ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 font-medium text-fg text-xs transition-colors hover:bg-surface-strong"
              title={m.ui_unsubscribe_collection()}
              aria-label={m.ui_unsubscribe_collection()}
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
              {m.ui_subscribed_collection()}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg px-3 py-1.5 text-danger text-xs transition-colors hover:bg-danger/10"
            >
              {m.ui_delete_playlist()}
            </button>
          )}
        </div>
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
              ({allVideos.length})
            </span>
          </button>
          {sections.map((section) => {
            const isSelected = activeSectionId === section.id;
            const secCount = allVideos.filter((v: PlaylistVideoItem) =>
              section.videoUrls.includes(v.url.trim()),
            ).length;
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
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-32 text-center">
          <p className="text-fg-muted text-sm">
            {allVideos.length > 0
              ? m.ui_all_videos_in_playlist_blocked()
              : m.ui_no_videos_in_playlist_yet()}
          </p>
          <p className="text-fg-soft text-xs">
            {m.ui_save_videos_from_the_watch_page_using_the_save_button()}
          </p>
        </div>
      ) : (
        <PlaylistGrid
          videos={sortedVideos}
          reorderable={reorderable}
          listId={id}
          onRemove={isCollection ? undefined : setPendingRemove}
          onReorder={(order) => reorder.mutate({ id, order })}
        />
      )}
      {pendingRemove && (
        <ConfirmModal
          title={m.ui_remove_video()}
          description={m.ui_remove_video_from_playlist_question({ name: pendingRemove.title })}
          confirmLabel={m.ui_remove()}
          onConfirm={() => {
            removeVideo.mutate({ playlistId: playlist.id, videoUrl: pendingRemove.url });
            setPendingRemove(null);
          }}
          onCancel={() => setPendingRemove(null)}
        />
      )}
      {confirmingDelete && (
        <ConfirmModal
          title={
            isCollection
              ? m.ui_unsubscribe_collection_question({ name: playlist.name })
              : m.ui_delete_playlist()
          }
          description={
            isCollection
              ? m.ui_unsubscribe_collection_confirmation()
              : m.ui_delete_playlist_confirmation({ name: playlist.name })
          }
          confirmLabel={isCollection ? m.ui_unsubscribe_collection() : m.ui_delete()}
          onConfirm={() => {
            setConfirmingDelete(false);
            handleDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {renaming && (
        <PlaylistRenameModal
          currentName={playlist.name}
          onConfirm={(name) => {
            const trimmed = name.trim();
            if (trimmed && trimmed !== playlist.name) {
              if (isCollection) {
                const origTitle = extractCollectionOriginalTitle(playlist);
                const meta = getSubscribedCollectionMeta(id);
                if (meta) {
                  const updated = { ...meta, title: trimmed, originalTitle: origTitle };
                  saveSubscribedCollectionMeta(updated);
                  setCollectionMeta(updated);
                }
                rename.mutate({
                  id,
                  name: trimmed,
                  description: `[collection:${origTitle}]`,
                });
              } else {
                rename.mutate({ id, name: trimmed });
              }
            }
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/playlists_/$id")({ component: PlaylistDetailPage });
