import { FolderPlus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePlaylists } from "../hooks/use-playlists";
import { m } from "../paraglide/messages.js";
import type { WatchPlaylistItem } from "../types/playlist";

const MARGIN = 8;

type Props = {
  collectionName: string;
  videos: WatchPlaylistItem[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSaved: (label: string) => void;
};

export function CollectionPlaylistAddDropdown({
  collectionName,
  videos,
  anchorEl,
  onClose,
  onSaved,
}: Props) {
  const { query, create, addVideo } = usePlaylists();
  const playlists = query.data ?? [];
  const [newName, setNewName] = useState(collectionName);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const anchorElRef = useRef(anchorEl);
  anchorElRef.current = anchorEl;

  useLayoutEffect(() => {
    if (!anchorEl || !panelRef.current) return;
    const anchor = anchorEl.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let left = anchor.right - panel.width;
    left = Math.min(left, vw - panel.width - MARGIN);
    left = Math.max(MARGIN, left);

    const spaceBelow = vh - anchor.bottom - MARGIN;
    const spaceAbove = anchor.top - MARGIN;
    let top: number;
    if (spaceBelow >= panel.height || spaceBelow >= spaceAbove) {
      top = anchor.bottom + MARGIN;
    } else {
      top = anchor.top - panel.height - MARGIN;
    }
    top = Math.max(MARGIN, Math.min(top, vh - panel.height - MARGIN));

    setPanelStyle({ position: "fixed", top, left, visibility: "visible" });
  }, [anchorEl]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const outsidePanel = panelRef.current && !panelRef.current.contains(target);
      const outsideAnchor = !anchorElRef.current?.contains(target);
      if (outsidePanel && outsideAnchor) onCloseRef.current();
    }
    function onScroll() {
      onCloseRef.current();
    }
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  async function addVideosToPlaylist(playlistId: string, targetName: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      for (const video of videos) {
        addVideo.mutate({
          playlistId,
          video: {
            url: video.url,
            title: video.title,
            thumbnail: video.thumbnail,
            channelName: video.channelName ?? "",
            channelUrl: "",
            channelAvatar: "",
            viewCount: 0,
            duration: 0,
          },
        });
      }
      onSaved(m.ui_saved_to_playlist({ name: `${targetName} (${videos.length})` }));
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAndAdd() {
    const trimmed = newName.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const result = await create.mutateAsync(trimmed);
      const createdId = (result as { id?: string })?.id;
      if (createdId) {
        await addVideosToPlaylist(createdId, trimmed);
      } else {
        onSaved(m.ui_playlist_named_created({ name: trimmed }));
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col w-64 max-h-80 overflow-hidden rounded-xl bg-surface border border-border shadow-2xl"
      style={panelStyle}
    >
      <div className="flex-shrink-0 px-3 pt-3 pb-1 border-b border-border">
        <p className="text-xs font-semibold text-fg flex items-center gap-1.5">
          <FolderPlus className="h-3.5 w-3.5 text-fg-muted" aria-hidden="true" />
          <span>{m.watch_save_playlist()}</span>
        </p>
        <p className="text-[11px] text-fg-muted truncate">
          {collectionName} · {videos.length} videos
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-1">
        {playlists.length === 0 && (
          <p className="text-xs text-fg-soft px-2.5 py-3">{m.ui_no_custom_playlists_yet()}</p>
        )}
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            type="button"
            disabled={submitting}
            onClick={() => void addVideosToPlaylist(playlist.id, playlist.name)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs text-left hover:bg-surface-strong transition-colors text-fg"
          >
            <span className="truncate">{playlist.name}</span>
            <span className="text-[10px] text-fg-soft shrink-0">+{videos.length}</span>
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-border p-2 flex gap-1.5 bg-surface-muted/50">
        <input
          type="text"
          value={newName}
          disabled={submitting}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleCreateAndAdd()}
          placeholder={m.ui_new_playlist_2()}
          className="min-w-0 flex-1 text-xs bg-surface text-fg placeholder-fg-soft rounded-lg px-2.5 py-1.5 outline-none border border-border focus:border-fg-muted"
        />
        <button
          type="button"
          disabled={submitting || !newName.trim()}
          onClick={() => void handleCreateAndAdd()}
          className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-fg text-app hover:opacity-90 font-medium rounded-lg transition-opacity disabled:opacity-50"
        >
          {m.ui_create()}
        </button>
      </div>
    </div>,
    document.body,
  );
}
