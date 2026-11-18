import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { clampVolume, startAdVideo } from "../lib/ad-player";

type AdVideoOptions = {
  src: string;
  volume: number;
  muted: boolean;
  loop?: boolean;
  startAt: number;
  onTime: (seconds: number) => void;
  onEnded: () => void;
  onSoundBlocked: () => void;
};

export type AdVideo = {
  ref: RefObject<HTMLVideoElement | null>;
  blocked: boolean;
  paused: boolean;
  elapsed: number;
  duration: number;
  start: () => void;
  togglePause: () => void;
  seek: (seconds: number) => void;
};

// Plays one ad file from start to end, resuming at `startAt` when the ad was left unfinished.
export function useAdVideo({
  src,
  volume,
  muted,
  loop = false,
  startAt,
  onTime,
  onEnded,
  onSoundBlocked,
}: AdVideoOptions): AdVideo {
  const ref = useRef<HTMLVideoElement | null>(null);
  const endedRef = useRef(onEnded);
  const soundBlockedRef = useRef(onSoundBlocked);
  const startAtRef = useRef(startAt);
  const timeRef = useRef(onTime);
  const [blocked, setBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ elapsed: 0, duration: 0 });
  endedRef.current = onEnded;
  soundBlockedRef.current = onSoundBlocked;
  startAtRef.current = startAt;
  timeRef.current = onTime;

  const start = useCallback(() => {
    const video = ref.current;
    if (!video) return;
    setPaused(false);
    startAdVideo(video, () => soundBlockedRef.current(), setBlocked);
  }, []);

  const togglePause = useCallback(() => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) return start();
    video.pause();
    setPaused(true);
  }, [start]);

  const seek = useCallback((seconds: number) => {
    const video = ref.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const to = Math.min(Math.max(0, seconds), Math.max(0, video.duration - 0.05));
    video.currentTime = to;
    setTime({ elapsed: to, duration: video.duration });
    timeRef.current(to);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const resumeAt = startAtRef.current;
    video.src = resumeAt > 0 ? `${src}#t=${resumeAt.toFixed(2)}` : src;
    setTime({ elapsed: resumeAt, duration: 0 });
    start();
  }, [src, start]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.volume = clampVolume(volume);
    video.muted = muted;
    video.loop = loop;
  }, [volume, muted, loop]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const tick = () => {
      setTime({ elapsed: video.currentTime, duration: video.duration || 0 });
      if (video.currentTime > 0) timeRef.current(video.currentTime);
    };
    const end = () => endedRef.current();
    video.addEventListener("timeupdate", tick);
    video.addEventListener("loadedmetadata", tick);
    video.addEventListener("ended", end);
    // A missing or broken file must not leave the viewer stuck in front of an empty ad.
    video.addEventListener("error", end);
    return () => {
      video.removeEventListener("timeupdate", tick);
      video.removeEventListener("loadedmetadata", tick);
      video.removeEventListener("ended", end);
      video.removeEventListener("error", end);
      video.pause();
    };
  }, []);

  return {
    ref,
    blocked,
    paused,
    elapsed: time.elapsed,
    duration: time.duration,
    start,
    togglePause,
    seek,
  };
}
