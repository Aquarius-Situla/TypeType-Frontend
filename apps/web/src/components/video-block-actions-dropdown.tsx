import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";

const MARGIN = 8;

type Props = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onSaveToPlaylist?: () => void;
  onToggleWatchLater?: () => void;
  onToggleWatched?: () => void;
  onToggleVideoBlock?: () => void;
  onToggleChannelBlock?: () => void;
  watchLaterSaved?: boolean;
  watchLaterPending?: boolean;
  watched?: boolean;
  videoBlocked?: boolean;
  channelBlocked?: boolean;
};

export function VideoBlockActionsDropdown({
  anchorEl,
  onClose,
  onPlayNext,
  onAddToQueue,
  onSaveToPlaylist,
  onToggleWatchLater,
  onToggleWatched,
  onToggleVideoBlock,
  onToggleChannelBlock,
  watchLaterSaved = false,
  watchLaterPending = false,
  watched = false,
  videoBlocked,
  channelBlocked,
}: Props) {
  const { locale } = useInterfaceLocale();
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
    let top =
      spaceBelow >= panel.height || spaceBelow >= spaceAbove
        ? anchor.bottom + MARGIN
        : anchor.top - panel.height - MARGIN;
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
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

  return createPortal(
    <div
      ref={panelRef}
      style={panelStyle}
      className="fixed z-50 w-56 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
    >
      {onPlayNext && (
        <button
          type="button"
          onClick={() => {
            onPlayNext();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {m.queue_play_next({}, { locale })}
        </button>
      )}
      {onAddToQueue && (
        <button
          type="button"
          onClick={() => {
            onAddToQueue();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {m.queue_add({}, { locale })}
        </button>
      )}
      {onToggleWatchLater && (
        <button
          type="button"
          onClick={() => {
            onToggleWatchLater();
            onClose();
          }}
          disabled={watchLaterPending}
          aria-pressed={watchLaterSaved}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong disabled:cursor-wait disabled:opacity-60"
        >
          {watchLaterSaved
            ? m.watch_remove_later({}, { locale })
            : m.watch_save_later({}, { locale })}
        </button>
      )}
      {onToggleWatched && (
        <button
          type="button"
          onClick={() => {
            onToggleWatched();
            onClose();
          }}
          aria-pressed={watched}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {watched ? m.ui_mark_as_unwatched({}, { locale }) : m.ui_mark_as_watched({}, { locale })}
        </button>
      )}
      {onSaveToPlaylist && (
        <button
          type="button"
          onClick={onSaveToPlaylist}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {m.watch_save_playlist({}, { locale })}
        </button>
      )}
      {onToggleVideoBlock && (
        <button
          type="button"
          onClick={() => {
            onToggleVideoBlock();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {videoBlocked
            ? m.watch_unblock_video({}, { locale })
            : m.watch_block_video({}, { locale })}
        </button>
      )}
      {onToggleChannelBlock && (
        <button
          type="button"
          onClick={() => {
            onToggleChannelBlock();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {channelBlocked
            ? m.watch_unblock_channel({}, { locale })
            : m.watch_block_channel({}, { locale })}
        </button>
      )}
    </div>,
    document.body,
  );
}
