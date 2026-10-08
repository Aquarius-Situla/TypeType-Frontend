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

const PRE_MOUNT_MS = 1000;

export function DanmakuOverlay({ comments, positionRef, paused: pausedProp }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState<IndexedComment[]>([]);
  const startMsMap = useRef(new Map<number, number>());
  const lastMsRef = useRef<number | null>(null);
  const [seekEpoch, setSeekEpoch] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoRate, setVideoRate] = useState(1);
  const { speed, size } = useDanmakuStore();

  const mediaPaused = useMediaState("paused");
  const mediaPlaybackRate = useMediaState("playbackRate");
  const paused = pausedProp ?? (videoPaused || mediaPaused);
  const playbackRate = videoRate || mediaPlaybackRate || 1;

  useEffect(() => {
    const el = overlayRef.current;
    const video =
      el?.closest(".vds-media-player")?.querySelector("video") || document.querySelector("video");
    videoRef.current = video;
    if (!video) return;

    const update = () => {
      setVideoPaused(video.paused);
      setVideoRate(video.playbackRate || 1);
    };
    update();

    const events = ["play", "pause", "seeking", "seeked", "waiting", "playing", "ratechange"];
    for (const ev of events) video.addEventListener(ev, update);
    return () => {
      for (const ev of events) video.removeEventListener(ev, update);
    };
  }, []);

  const indexed = useMemo<IndexedComment[]>(
    () => comments.map((c, i) => ({ ...c, lane: i % N_LANES, id: i })),
    [comments],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset epoch on param changes
  useEffect(() => {
    startMsMap.current.clear();
    setSeekEpoch((e) => e + 1);
  }, [indexed, speed, playbackRate]);

  useEffect(() => {
    let rafId: number;
    let prevKey = "";

    function tick() {
      const video = videoRef.current;
      const ms =
        video && !Number.isNaN(video.currentTime) && video.currentTime > 0
          ? Math.round(video.currentTime * 1000)
          : (positionRef.current ?? 0);

      const currentSpeed = useDanmakuStore.getState().speed;
      const effectiveSpeed = currentSpeed * (mediaPlaybackRate || 1);

      if (lastMsRef.current !== null && Math.abs(ms - lastMsRef.current) > 1500) {
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
        const minElapsed = c.position === "REGULAR" ? -PRE_MOUNT_MS : 0;
        return elapsed >= minElapsed && elapsed < dur;
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

  const prevWidthRef = useRef(width);
  useEffect(() => {
    if (Math.abs(width - prevWidthRef.current) > 40) {
      prevWidthRef.current = width;
      startMsMap.current.clear();
      setSeekEpoch((e) => e + 1);
    }
  }, [width]);

  return (
    <div
      ref={overlayRef}
      style={
        {
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 20,
          isolation: "isolate",
          contain: "paint layout",
          clipPath: "inset(0)",
          WebkitClipPath: "inset(0)",
          containerType: "inline-size",
          transform: "translate3d(0, 0, 0)",
          WebkitTransform: "translate3d(0, 0, 0)",
          "--d-width": `${width}px`,
        } as React.CSSProperties
      }
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
