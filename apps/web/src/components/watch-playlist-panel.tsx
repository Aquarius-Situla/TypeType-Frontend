import { ChevronDown, FolderPlus, Shuffle } from "lucide-react";
import { type DragEvent, type UIEvent, useEffect, useRef, useState } from "react";
import { useFlipList } from "../hooks/use-flip-list";
import { useMobile } from "../hooks/use-mobile";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { WatchPlaylistItem } from "../types/playlist";
import { CollectionPlaylistAddDropdown } from "./collection-playlist-add-dropdown";
import { Toast } from "./toast";
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
  onToggleShuffle?: () => void;
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
  onToggleShuffle,
  onReorder,
}: Props) {
  const isMobile = useMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const currentElement = useRef<HTMLLIElement | null>(null);

  const sectionWithCurrent = sections?.find((sec) =>
    sec.videos.some((video) => toPublicWatchParam(video.url) === currentParam),
  );
  const sectionWithCurrentId = sectionWithCurrent?.id;
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    sectionWithCurrentId ?? sections?.[0]?.id ?? null,
  );

  const [addDropdownAnchor, setAddDropdownAnchor] = useState<HTMLElement | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

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
  const reorderable = Boolean(onReorder) && !activeSection;
  const register = useFlipList(displayVideos.map((video) => video.key).join("|"));

  useEffect(() => {
    if (!collapsed && currentIndex >= 0) {
      currentElement.current?.scrollIntoView({ block: "nearest" });
    }
  }, [collapsed, currentIndex]);

  function commit(next: WatchPlaylistItem[]) {
    onReorder?.(next);
  }
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
      commit(next);
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
    commit(next);
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
          className="flex min-w-0 max-w-[calc(100%-84px)] flex-1 flex-col items-start overflow-hidden text-left"
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
        <div className="flex shrink-0 items-center gap-1.5">
          {onToggleShuffle && (
            <button
              type="button"
              onClick={onToggleShuffle}
              aria-label={m.ui_shuffle_playlist()}
              title={m.ui_shuffle_playlist()}
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                shuffle ? "bg-fg text-app" : "text-fg-muted hover:bg-surface-strong hover:text-fg"
              }`}
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => setAddDropdownAnchor(e.currentTarget)}
            aria-label={m.watch_save_playlist()}
            title={m.watch_save_playlist()}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-fg-muted transition-colors hover:border-border-strong hover:bg-surface-strong hover:text-fg"
          >
            <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? m.ui_expand_playlist() : m.ui_collapse_playlist()}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-fg-muted transition-colors hover:text-fg"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
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
        <ul className="max-h-[24rem] list-none overflow-y-auto py-1" onScroll={handleScroll}>
          {displayVideos.map((video, index) => {
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
      {addDropdownAnchor && (
        <CollectionPlaylistAddDropdown
          collectionName={name}
          videos={displayVideos}
          anchorEl={addDropdownAnchor}
          onClose={() => setAddDropdownAnchor(null)}
          onSaved={(msg) => setToastMsg(msg)}
        />
      )}
      <Toast message={toastMsg} />
    </section>
  );
}
