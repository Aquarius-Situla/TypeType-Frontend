import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { displayDuration, N_LANES, REGULAR_DISPLAY_MS } from "../lib/danmaku";
import { useMediaState } from "../lib/vidstack";
import { useDanmakuStore } from "../stores/danmaku-store";
import type { BulletCommentItem } from "../types/api";
import { DanmakuItem } from "./danmaku-item";

type Props = {
  comments: BulletCommentItem[];
  positionRef: React.RefObject<number>;
  paused?: boolean;
};

type IndexedComment = BulletCommentItem & { lane: number; id: number };

export function DanmakuOverlay({ comments, positionRef, paused: pausedProp }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<IndexedComment[]>([]);
  const startMsMap = useRef(new Map<number, number>());
  const lastMsRef = useRef<number | null>(null);
  const [seekEpoch, setSeekEpoch] = useState(0);
  const { speed, size } = useDanmakuStore();

  const mediaPaused = useMediaState("paused");
  const mediaPlaybackRate = useMediaState("playbackRate");
  const paused = pausedProp ?? mediaPaused;
  const playbackRate = mediaPlaybackRate || 1;

  const indexed = useMemo<IndexedComment[]>(
    () =>
      comments
        .map((c, i) => ({ ...c, lane: i % N_LANES, id: i })),
    [comments],
  );

  useEffect(() => {
    startMsMap.current.clear();
    setSeekEpoch((e) => e + 1);
  }, [indexed, speed, playbackRate]);

  useEffect(() => {
    let rafId: number;
    let prevKey = "";

    function tick() {
      const ms = positionRef.current;
      const currentSpeed = useDanmakuStore.getState().speed;
      const effectiveSpeed = currentSpeed * (mediaPlaybackRate || 1);

      if (lastMsRef.current !== null && Math.abs(ms - lastMsRef.current) > 300) {
        startMsMap.current.clear();
        setSeekEpoch((e) => e + 1);
        prevKey = "";
      }
      lastMsRef.current = ms;

      const vis = indexed.filter((c) => {
        const elapsed = ms - c.durationMs;
        const dur =
          c.position === "REGULAR"
            ? REGULAR_DISPLAY_MS / effectiveSpeed + 300
            : displayDuration(c.position);
        return elapsed >= 0 && elapsed < dur;
      });
      const key = vis.map((c) => c.id).join(",");
      if (key !== prevKey) {
        prevKey = key;
        for (const c of vis) {
          if (!startMsMap.current.has(c.id)) {
            startMsMap.current.set(c.id, ms);
          }
        }
        for (const id of Array.from(startMsMap.current.keys())) {
          if (!vis.some((c) => c.id === id)) {
            startMsMap.current.delete(id);
          }
        }
        setVisible(vis);
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [indexed, positionRef, mediaPlaybackRate]);

  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const width =
    containerWidth ||
    overlayRef.current?.offsetWidth ||
    (typeof window !== "undefined" ? window.innerWidth : 1280);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 20,
        isolation: "isolate",
        containerType: "inline-size",
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
        "--d-width": `${width}px`,
      } as React.CSSProperties}
    >
      {visible.map((c) => (
        <DanmakuItem
          key={`${c.id}-${seekEpoch}`}
          comment={c}
          lane={c.lane}
          containerWidth={width}
          elapsedMs={(startMsMap.current.get(c.id) ?? positionRef.current) - c.durationMs}
          speedMultiplier={speed}
          sizeMultiplier={size}
          paused={paused}
          playbackRate={playbackRate}
        />
      ))}
    </div>
  );
}
