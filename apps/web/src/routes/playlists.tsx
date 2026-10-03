import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "../components/confirm-modal";
import { LibraryCollectionCard } from "../components/library-collection-card";
import { PlaylistCard } from "../components/playlist-card";
import { PlaylistCreateModal } from "../components/playlist-create-modal";
import { PlaylistsEmptyState } from "../components/playlists-empty-state";
import { PlaylistsPageHeader } from "../components/playlists-page-header";
import { SavedPlaylistsSection } from "../components/saved-playlists-section";
import { Toast } from "../components/toast";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useFavoriteStreams } from "../hooks/use-favorite-streams";
import { usePlaylists } from "../hooks/use-playlists";
import { useSavedPlaylists } from "../hooks/use-saved-playlists";
import { useWatchLaterStreams } from "../hooks/use-watch-later-streams";
import { filterPlaylistSummaries } from "../lib/playlist-summary";
import { m } from "../paraglide/messages.js";
import type { SavedPlaylistItem } from "../types/playlist";

function PlaylistsPage() {
  const { query, create, remove } = usePlaylists();
  const savedPlaylists = useSavedPlaylists();
  const favorites = useFavoriteStreams();
  const watchLater = useWatchLaterStreams();
  const playlists = query.data ?? [];
  const { filter, isPlaylistBlocked } = useBlockedFilter();
  const visibleFavorites = useMemo(() => filter(favorites.videos), [favorites.videos, filter]);
  const visibleWatchLater = useMemo(() => filter(watchLater.videos), [filter, watchLater.videos]);
  const visiblePlaylists = useMemo(
    () => filterPlaylistSummaries(playlists, filter),
    [filter, playlists],
  );
  const saved = savedPlaylists.items.filter((playlist) => !isPlaylistBlocked(playlist));
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [savedConfirm, setSavedConfirm] = useState<SavedPlaylistItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function handleConfirm() {
    if (!confirmIds) return;
    const count = confirmIds.length;
    for (const id of confirmIds) remove.mutate(id);
    setConfirmIds(null);
    exitSelection();
    setToastMsg(count === 1 ? m.ui_playlist_deleted() : m.ui_playlists_deleted({ count }));
  }

  function handleSavedConfirm() {
    if (!savedConfirm) return;
    savedPlaylists.remove.mutate(savedConfirm.id);
    setToastMsg(m.ui_saved_playlist_removed({ name: savedConfirm.title }));
    setSavedConfirm(null);
  }

  const confirmTitle =
    confirmIds === null
      ? ""
      : confirmIds.length === 1
        ? m.ui_delete_playlist_question({
            name: playlists.find((p) => p.id === confirmIds[0])?.name ?? m.ui_this_playlist(),
          })
        : m.ui_delete_playlists_question({ count: confirmIds.length });
  const hasLocalCollections =
    playlists.length > 0 || visibleFavorites.length > 0 || visibleWatchLater.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4 [animation:page-fade-in_0.2s_ease-out]">
      <PlaylistsPageHeader
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        canSelect={playlists.length > 0}
        onSelect={() => setSelectionMode(true)}
        onCancel={exitSelection}
        onDelete={() => setConfirmIds([...selectedIds])}
        onCreate={() => setCreating(true)}
      />
      <SavedPlaylistsSection playlists={saved} onDelete={setSavedConfirm} />
      {!hasLocalCollections && saved.length === 0 ? (
        <PlaylistsEmptyState />
      ) : hasLocalCollections ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <LibraryCollectionCard
            kind="favorites"
            title={m.portability_category_favorites()}
            count={visibleFavorites.length}
            thumbnail={visibleFavorites[0]?.thumbnail}
          />
          <LibraryCollectionCard
            kind="watch-later"
            title={m.portability_category_watch_later()}
            count={visibleWatchLater.length}
            thumbnail={visibleWatchLater[0]?.thumbnail}
          />
          {visiblePlaylists.map((playlist, index) => (
            <div
              key={playlist.id}
              className="animate-card-pop-in"
              style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
            >
              <PlaylistCard
                playlist={playlist}
                selectionMode={selectionMode}
                selected={selectedIds.has(playlist.id)}
                onToggleSelect={() => toggleSelect(playlist.id)}
                onDeleteRequest={() => setConfirmIds([playlist.id])}
              />
            </div>
          ))}
        </div>
      ) : null}
      {creating && (
        <PlaylistCreateModal
          onConfirm={(name) => {
            create.mutate(name);
            setCreating(false);
            setToastMsg(m.ui_playlist_created({ name }));
          }}
          onCancel={() => setCreating(false)}
        />
      )}
      {confirmIds !== null && (
        <ConfirmModal
          title={confirmTitle}
          description={m.ui_this_action_cannot_be_undone()}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmIds(null)}
        />
      )}
      {savedConfirm !== null && (
        <ConfirmModal
          title={m.ui_remove_saved_playlist_question({ name: savedConfirm.title })}
          description={m.ui_this_only_removes_the_saved_reference_from_your_library()}
          onConfirm={handleSavedConfirm}
          onCancel={() => setSavedConfirm(null)}
        />
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

export const Route = createFileRoute("/playlists")({
  component: PlaylistsPage,
});
