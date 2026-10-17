import { Check, ChevronDown, FolderPlus } from "lucide-react";
import { type DragEvent, type UIEvent, useEffect, useRef, useState } from "react";
import { useFlipList } from "../hooks/use-flip-list";
import { useMobile } from "../hooks/use-mobile";
import { usePlaylistVisibility } from "../hooks/use-playlist-visibility";
import { useSavedPlaylists } from "../hooks/use-saved-playlists";
import { isBilibiliCollectionUrl } from "../lib/api-bilibili-channel-collections";
import { isManagedPlaylistId } from "../lib/playlist-url";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { WatchPlaylistItem } from "../types/playlist";
import { Toast } from "./toast";
import {
  type PlaylistShuffleMode,
  WatchPlaylistShuffleControl,
  WatchPlaylistVisibilityToggle,
} from "./watch-playlist-controls";
import { WatchPlaylistRow } from "./watch-playlist-row";

type WatchPlaylistSection = {
  id: string;
  title: string;
  videos: WatchPlaylistItem[];
};

type Props = {
  name: string;
  videos: WatchPlaylistItem[];
  sections?: WatchPlaylistSection[];
  listId?: string;
  currentParam: string;
  shuffle: string | undefined;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onShuffleChange?: (mode: PlaylistShuffleMode) => void;
  allowContinuous?: boolean;
  onReorder?: (videos: WatchPlaylistItem[]) => void;
};

export function WatchPlaylistPanel({
  name,
  videos,
  sections,
  listId,
  currentParam,
  shuffle,
  isLoadingMore = false,
  onLoadMore,
  onShuffleChange,
  allowContinuous = false,
  onReorder,
}: Props) {
  const isMobile = useMobile();
  const visibility = usePlaylistVisibility(listId);
  const [collapsed, setCollapsed] = useState(isMobile);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const currentElement = useRef<HTMLLIElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const sectionWithCurrent = sections?.find((sec) =>
    sec.videos.some((video) => toPublicWatchParam(video.url) === currentParam),
  );
  const sectionWithCurrentId = sectionWithCurrent?.id;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sectionWithCurrentId ?? sections?.[0]?.id ?? null,
  );

  useEffect(() => {
    if (sectionWithCurrentId) {
      setSelectedSectionId(sectionWithCurrentId);
    }
  }, [sectionWithCurrentId]);

  const activeSection =
    sections && sections.length > 1
      ? (sections.find((sec) => sec.id === selectedSectionId) ?? sections[0])
      : null;
  const displayVideos = activeSection ? activeSection.videos : videos;
  const currentIndex = displayVideos.findIndex(
    (video) => toPublicWatchParam(video.url) === currentParam,
  );
  const reorderable = Boolean(onReorder) && !activeSection && !visibility.hidden && !shuffle;
  const register = useFlipList(displayVideos.map((video) => video.key).join("|"));

  const isManaged = Boolean(listId && isManagedPlaylistId(listId));
  const isCollection =
    Boolean(sections && sections.length > 0) || (listId ? isBilibiliCollectionUrl(listId) : false);
  const isUserOwnPlaylist = isManaged && !isCollection;

  const isPublicPlaylist = Boolean(listId && !isManaged);
  const publicListUrl = listId
    ? listId.startsWith("http") || listId.startsWith("bilibili:")
      ? listId
      : `https://www.youtube.com/playlist?list=${listId}`
    : "";

  const savedPlaylists = useSavedPlaylists();
  const savedPublic = isPublicPlaylist ? savedPlaylists.findSaved(publicListUrl) : undefined;
  const isSubscribed = Boolean(savedPublic);
  const isSubscribing = isPublicPlaylist
    ? savedPlaylists.save.isPending || savedPlaylists.remove.isPending
    : false;
  const showSubscribeButton = !isUserOwnPlaylist && isPublicPlaylist;

  async function handleToggleSubscribe() {
    if (isSubscribing || !isPublicPlaylist) return;
    if (savedPublic) {
      savedPlaylists.remove.mutate(savedPublic.id, {
        onSuccess: () => setToastMsg(m.ui_playlist_removed()),
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setToastMsg(msg || m.ui_failed());
        },
      });
    } else {
      const firstItem = displayVideos[0];
      savedPlaylists.save.mutate(
        {
          url: publicListUrl,
          info: {
            id: listId,
            title: name,
            thumbnailUrl: firstItem?.thumbnail || "",
            uploaderName: firstItem?.channelName || "",
            streamCount: displayVideos.length,
          },
        },
        {
          onSuccess: () => setToastMsg(m.ui_playlist_saved()),
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            setToastMsg(msg || m.ui_failed());
          },
        },
      );
    }
  }

  useEffect(() => {
    if (!collapsed && currentIndex >= 0) {
      const frame = requestAnimationFrame(() => {
        currentElement.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [collapsed, currentIndex]);

  function handleDragStart(event: DragEvent, index: number) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    const row = (event.currentTarget as HTMLElement).closest("[data-pl-row]");
    if (row instanceof HTMLElement) event.dataTransfer.setDragImage(row, 20, 20);
  }
  function handleDrop(targetIndex: number) {
    if (onReorder && dragIndex !== null && dragIndex !== targetIndex) {
      const next = [...videos];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  }
  function moveItem(index: number, direction: number) {
    const target = index + direction;
    if (!onReorder || target < 0 || target >= videos.length) return;
    const next = [...videos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onReorder(next);
  }
  function handleScroll(event: UIEvent<HTMLUListElement>) {
    if (!onLoadMore || isLoadingMore) return;
    const list = event.currentTarget;
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (remaining < 480) onLoadMore();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-2 border-border border-b px-3 py-2.5">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex min-w-0 max-w-[calc(100%-80px)] sm:max-w-[calc(100%-100px)] flex-1 flex-col items-start overflow-hidden text-left"
        >
          <span
            className="w-full line-clamp-2 break-words font-medium text-fg text-sm leading-snug"
            title={name}
          >
            {name}
          </span>
          <span className="mt-1 text-fg-soft text-xs">
            {currentIndex >= 0 ? currentIndex + 1 : "-"} / {displayVideos.length}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 self-center">
          {showSubscribeButton && (
            <button
              type="button"
              disabled={isSubscribing}
              onClick={() => void handleToggleSubscribe()}
              aria-label={isSubscribed ? m.ui_saved() : m.ui_save()}
              title={isSubscribed ? m.ui_saved() : m.ui_save()}
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isSubscribed
                  ? "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
                  : "border-border text-fg-muted hover:border-border-strong hover:bg-surface-strong hover:text-fg"
              }`}
            >
              {isSubscribed ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? m.ui_expand_playlist() : m.ui_collapse_playlist()}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:text-fg"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="flex items-center gap-3 border-border border-b px-3 py-2">
          <WatchPlaylistShuffleControl
            shuffle={shuffle}
            allowContinuous={allowContinuous}
            onShuffleChange={onShuffleChange}
          />
          <div className="ml-auto">
            <WatchPlaylistVisibilityToggle
              hidden={visibility.hidden}
              onToggleHidden={visibility.toggle}
            />
          </div>
        </div>
      )}
      {!collapsed && sections && sections.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-border border-b px-3 py-2 no-scrollbar">
          {sections.map((section) => {
            const isSelected = (activeSection?.id ?? sections[0].id) === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSectionId(section.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-fg text-app"
                    : "bg-surface-strong/70 text-fg-muted hover:bg-surface-strong hover:text-fg"
                }`}
              >
                <span>{section.title}</span>
                <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-fg-soft"}`}>
                  ({section.videos.length})
                </span>
              </button>
            );
          })}
        </div>
      )}
      {!collapsed && (
        <ul
          ref={listRef}
          className="max-h-[24rem] list-none overflow-y-auto py-1"
          onScroll={handleScroll}
        >
          {displayVideos.map((video, index) => {
            if (visibility.hidden && currentIndex >= 0 && index > currentIndex) return null;
            const isCurrent = index === currentIndex;

            return (
              <li
                key={video.key}
                ref={(element) => {
                  register(video.key, element);
                  if (isCurrent) currentElement.current = element;
                }}
                data-pl-row="true"
                className={`group flex items-center gap-1 px-1 transition-colors hover:bg-surface-strong/60 ${
                  overIndex === index && dragIndex !== null ? "ring-1 ring-accent ring-inset" : ""
                } ${dragIndex === index ? "opacity-40" : ""} ${isCurrent ? "bg-surface-strong" : ""}`}
                onDragOver={reorderable ? (event) => event.preventDefault() : undefined}
                onDragEnter={reorderable ? () => setOverIndex(index) : undefined}
                onDrop={reorderable ? () => handleDrop(index) : undefined}
                onDragEnd={
                  reorderable
                    ? () => {
                        setDragIndex(null);
                        setOverIndex(null);
                      }
                    : undefined
                }
              >
                <WatchPlaylistRow
                  video={video}
                  index={index}
                  total={displayVideos.length}
                  isCurrent={isCurrent}
                  reorderable={reorderable}
                  isMobile={isMobile}
                  listId={listId}
                  shuffle={shuffle}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onMove={(direction) => moveItem(index, direction)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <Toast message={toastMsg} />
    </section>
  );
}
