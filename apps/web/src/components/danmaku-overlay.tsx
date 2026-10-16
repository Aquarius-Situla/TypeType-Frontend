import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  displayDuration,
  isDanmakuPlaybackPaused,
  N_LANES,
  REGULAR_DISPLAY_MS,
} from "../lib/danmaku";
import { useMediaPlayer, useMediaState } from "../lib/vidstack";
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
  const player = useMediaPlayer();
  const [visible, setVisible] = useState<IndexedComment[]>([]);
  const startMsMap = useRef(new Map<number, number>());
  const lastMsRef = useRef<number | null>(null);
  const [seekEpoch, setSeekEpoch] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoWaiting, setVideoWaiting] = useState(false);
  const [videoSeeking, setVideoSeeking] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const isStalledRef = useRef(false);
  const needsResetRef = useRef(false);
  const [videoRate, setVideoRate] = useState(1);
  const { speed, size } = useDanmakuStore();

  const mediaPaused = useMediaState("paused");
  const mediaWaiting = useMediaState("waiting");
  const mediaSeeking = useMediaState("seeking");
  const mediaPlaybackRate = useMediaState("playbackRate");

  const paused = isDanmakuPlaybackPaused({
    pausedProp,
    videoPaused,
    mediaPaused,
    videoWaiting,
    mediaWaiting,
    mediaSeeking,
    videoSeeking,
    isStalled,
  });
  const playbackRate = videoRate || mediaPlaybackRate || 1;

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    function attach(): boolean {
      if (cleanup) return true;
      const root = player?.el || overlayRef.current?.closest(".vds-media-player") || document;
      const video =
        root.querySelector<HTMLVideoElement>("video") ||
        document.querySelector<HTMLVideoElement>("video");
      if (!video) return false;
      videoRef.current = video;

      const update = () => {
        const isPaused = video.paused;
        const isSeeking = video.seeking;
        const isWaiting = !isPaused && (video.readyState < 3 || isSeeking);
        setVideoPaused(isPaused);
        setVideoSeeking(isSeeking);
        setVideoWaiting(isWaiting);
        setVideoRate(video.playbackRate || 1);
      };
      update();

      const onWaiting = () => setVideoWaiting(true);
      const onPlaying = () => {
        setVideoWaiting(false);
        setVideoPaused(false);
        setVideoSeeking(false);
        if (isStalledRef.current) {
          isStalledRef.current = false;
          setIsStalled(false);
        }
      };
      const onSeeking = () => {
        setVideoSeeking(true);
        setVideoWaiting(true);
      };
      const onSeeked = () => {
        setVideoSeeking(false);
        needsResetRef.current = true;
        update();
      };

      video.addEventListener("waiting", onWaiting);
      video.addEventListener("stalled", onWaiting);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("seeking", onSeeking);
      video.addEventListener("seeked", onSeeked);

      const events = [
        "play",
        "pause",
        "ratechange",
        "canplay",
        "canplaythrough",
        "loadstart",
        "emptied",
      ];
      for (const ev of events) video.addEventListener(ev, update);

      cleanup = () => {
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("stalled", onWaiting);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("seeked", onSeeked);
        for (const ev of events) video.removeEventListener(ev, update);
      };
      return true;
    }

    if (attach()) return () => cleanup?.();

    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    const observeTarget =
      player?.el ||
      overlayRef.current?.closest(".vds-media-player") ||
      (typeof document !== "undefined" ? document.body : null);
    if (observeTarget) {
      observer.observe(observeTarget, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [player]);

  const indexed = useMemo<IndexedComment[]>(
    () => comments.map((c, i) => ({ ...c, lane: i % N_LANES, id: i })),
    [comments],
  );

  // The cached start times must reset when the comment set, the speed or the playback rate
  // changes, even though this effect only touches refs and state setters.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset triggers
  useEffect(() => {
    startMsMap.current.clear();
    setSeekEpoch((e) => e + 1);
  }, [indexed, speed, playbackRate]);

  useEffect(() => {
    let rafId: number;
    let prevKey = "";
    let lastAdvTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    let lastVideoTime = -1;

    function tick() {
      if (!videoRef.current) {
        const root = player?.el || overlayRef.current?.closest(".vds-media-player") || document;
        const v =
          root.querySelector<HTMLVideoElement>("video") ||
          document.querySelector<HTMLVideoElement>("video");
        if (v) videoRef.current = v;
      }
      const video = videoRef.current;
      const ms =
        video && !Number.isNaN(video.currentTime) && video.currentTime > 0
          ? Math.round(video.currentTime * 1000)
          : (positionRef.current ?? 0);

      const currentSpeed = useDanmakuStore.getState().speed;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();

      if (video) {
        if (!video.paused && !video.ended && video.playbackRate > 0) {
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            lastAdvTime = now;
            if (isStalledRef.current) {
              isStalledRef.current = false;
              setIsStalled(false);
            }
          } else {
            const stallThreshold = Math.max(300, 350 / (video.playbackRate || 1));
            if (now - lastAdvTime > stallThreshold) {
              if (!isStalledRef.current) {
                isStalledRef.current = true;
                setIsStalled(true);
              }
            }
          }
        } else {
          lastAdvTime = now;
          if (isStalledRef.current) {
            isStalledRef.current = false;
            setIsStalled(false);
          }
        }
      }

      if (
        needsResetRef.current ||
        (lastMsRef.current !== null && Math.abs(ms - lastMsRef.current) > 1000)
      ) {
        needsResetRef.current = false;
        startMsMap.current.clear();
        setSeekEpoch((e) => e + 1);
        prevKey = "";
      }
      lastMsRef.current = ms;

      const vis = indexed.filter((c) => {
        const elapsed = ms - c.durationMs;
        const dur =
          c.position === "REGULAR"
            ? REGULAR_DISPLAY_MS / currentSpeed + 300
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
  }, [indexed, positionRef, player?.el]);

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
          zIndex: 1,
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
