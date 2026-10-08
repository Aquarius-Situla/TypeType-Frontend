import { useRouterState } from "@tanstack/react-router";
import { GripVertical, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CompactPlayerContext } from "../hooks/use-compact-player";
import { useMobile } from "../hooks/use-mobile";
import {
  type PlayerPosition,
  usePersistentWatchPlayerStore,
} from "../hooks/use-persistent-watch-player";
import { isPlayerOutsideViewport } from "../lib/compact-player-position";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import { useWatchLayoutStore } from "../stores/watch-layout-store";
import { WatchStagePlayer } from "./watch-stage-player";

const HEADER_OFFSET = 56;
const VIEWPORT_MARGIN = 8;

type AnchorRect = { left: number; top: number; width: number; height: number };
type DragState = { offsetX: number; offsetY: number; pointerId: number };

function clampPosition(left: number, top: number, width: number, height: number): PlayerPosition {
  return {
    left: Math.min(
      Math.max(VIEWPORT_MARGIN, left),
      Math.max(VIEWPORT_MARGIN, innerWidth - width - VIEWPORT_MARGIN),
    ),
    top: Math.min(
      Math.max(HEADER_OFFSET + VIEWPORT_MARGIN, top),
      Math.max(HEADER_OFFSET + VIEWPORT_MARGIN, innerHeight - height - VIEWPORT_MARGIN),
    ),
  };
}

export function PersistentWatchPlayerHost() {
  const entry = usePersistentWatchPlayerStore((state) => state.entry);
  const position = usePersistentWatchPlayerStore((state) => state.position);
  const setPosition = usePersistentWatchPlayerStore((state) => state.setPosition);
  const close = usePersistentWatchPlayerStore((state) => state.close);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const isMobile = useMobile();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [outsideViewport, setOutsideViewport] = useState(false);
  const [landscapeWatch, setLandscapeWatch] = useState(false);
  const watchPage = pathname === "/watch" && !cinemaMode;
  const hiddenPage =
    pathname === "/shorts" || pathname === "/hide-everything" || pathname.startsWith("/embed/");

  useEffect(() => {
    const media = window.matchMedia(
      "(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)",
    );
    const update = () => setLandscapeWatch(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const updateAnchorRect = useCallback(() => {
    const anchor = entry?.anchor;
    if (!watchPage || !anchor) {
      setAnchorRect(null);
      setOutsideViewport(false);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setOutsideViewport((previous) => isPlayerOutsideViewport(rect.bottom, previous));
    setAnchorRect((previous) =>
      previous &&
      previous.left === rect.left &&
      previous.top === rect.top &&
      previous.width === rect.width &&
      previous.height === rect.height
        ? previous
        : { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    );
  }, [entry?.anchor, watchPage]);

  const syncFrame = useCallback(() => {
    const anchor = entry?.anchor;
    const frame = frameRef.current;
    if (anchor && frame && !outsideViewport && watchPage) {
      const rect = anchor.getBoundingClientRect();
      frame.style.top = `${rect.top}px`;
      frame.style.left = `${rect.left}px`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
    }
    updateAnchorRect();
  }, [entry?.anchor, outsideViewport, watchPage, updateAnchorRect]);

  useLayoutEffect(() => {
    syncFrame();
  }, [syncFrame]);

  useEffect(() => {
    const observer = new ResizeObserver(syncFrame);
    if (entry?.anchor) observer.observe(entry.anchor);

    const handleScroll = () => {
      syncFrame();
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", syncFrame);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", syncFrame);
    };
  }, [syncFrame, entry?.anchor]);

  useEffect(() => {
    if (!watchPage || outsideViewport) return;
    let rafId: number;
    const start = performance.now();
    const duration = 280;
    const tick = (now: number) => {
      syncFrame();
      if (now - start < duration) {
        rafId = requestAnimationFrame(tick);
      } else {
        syncFrame();
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [sidebarCollapsed, watchPage, outsideViewport, syncFrame]);

  useEffect(() => {
    if (!watchPage || outsideViewport) return;
    let rafId: number;
    const handleTransition = () => {
      cancelAnimationFrame(rafId);
      const start = performance.now();
      const duration = 280;
      const tick = (now: number) => {
        syncFrame();
        if (now - start < duration) {
          rafId = requestAnimationFrame(tick);
        } else {
          syncFrame();
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("transitionrun", handleTransition);
    window.addEventListener("transitionend", syncFrame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("transitionrun", handleTransition);
      window.removeEventListener("transitionend", syncFrame);
    };
  }, [watchPage, outsideViewport, syncFrame]);

  const floating = !watchPage || (!landscapeWatch && outsideViewport);
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      const frame = frameRef.current;
      if (!drag || !frame || event.pointerId !== drag.pointerId) return;
      const rect = frame.getBoundingClientRect();
      setPosition(
        clampPosition(
          event.clientX - drag.offsetX,
          event.clientY - drag.offsetY,
          rect.width,
          rect.height,
        ),
      );
    },
    [setPosition],
  );
  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("blur", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!position || !floating) return;
    const update = () => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const clamped = clampPosition(position.left, position.top, rect.width, rect.height);
      if (clamped.left !== position.left || clamped.top !== position.top) setPosition(clamped);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [floating, position, setPosition]);

  if (!entry?.enabled || hiddenPage) return null;

  const style: React.CSSProperties =
    !floating && anchorRect
      ? {
          left: anchorRect.left,
          top: anchorRect.top,
          width: anchorRect.width,
          height: anchorRect.height,
        }
      : !floating
        ? {
            opacity: 0,
            pointerEvents: "none",
          }
        : position
          ? { left: position.left, top: position.top }
          : {
              right: "1rem",
              bottom: `calc(${isMobile ? "4.5rem" : "1rem"} + env(safe-area-inset-bottom, 0px))`,
            };

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!floating || !frameRef.current || !event.isPrimary || event.button !== 0) return;
    const rect = frameRef.current.getBoundingClientRect();
    const next = position ?? clampPosition(rect.left, rect.top, rect.width, rect.height);
    setPosition(next);
    dragRef.current = {
      offsetX: event.clientX - next.left,
      offsetY: event.clientY - next.top,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  };

  return (
    <div
      ref={frameRef}
      className={`typetype-persistent-player-frame fixed overflow-hidden bg-black transition-[box-shadow,ring-width] duration-200 ${
        floating
          ? "z-30 rounded-lg shadow-2xl ring-1 ring-black/30"
          : "z-10 rounded-lg shadow-none ring-0"
      }`}
      data-floating={floating ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      style={style}
    >
      {floating && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-1 pt-1">
          <button
            type="button"
            aria-label={m.ui_move_player()}
            title={m.ui_move_player()}
            className="pointer-events-auto flex h-10 w-10 touch-none cursor-grab items-center justify-center rounded text-white hover:opacity-80 active:cursor-grabbing"
            onPointerDown={beginDrag}
            onLostPointerCapture={handlePointerUp}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={m.ui_close_player()}
            title={m.ui_close_player()}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded text-white hover:opacity-80"
            onClick={() => close(entry.owner)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <CompactPlayerContext.Provider value={floating}>
        <WatchStagePlayer {...entry.props} />
      </CompactPlayerContext.Provider>
    </div>
  );
}
