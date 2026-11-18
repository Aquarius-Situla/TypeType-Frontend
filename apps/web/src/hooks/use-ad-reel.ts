import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampVolume, startAdVideo } from "../lib/ad-player";

type AdReelOptions = {
  src: string;
  upcoming: readonly string[];
  volume: number;
  muted: boolean;
  loop: boolean;
  startAt: number;
  onTime: (seconds: number) => void;
  onEnded: () => void;
  // A clip that cannot load: the trial gives up rather than leave the viewer in front of nothing.
  onFailed: () => void;
  onSoundBlocked: () => void;
};

type AdReelClip = {
  src: string;
  front: boolean;
  attach: (video: HTMLVideoElement | null) => void;
  onPlaying: () => void;
  onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onEnded: () => void;
  onError: () => void;
};

export type AdReel = {
  clips: AdReelClip[];
  blocked: boolean;
  paused: boolean;
  elapsed: number;
  duration: number;
  start: () => void;
  togglePause: () => void;
  seek: (seconds: number) => void;
  // Ends the current clip at once, as if it had played to the end.
  skip: () => void;
};

// Plays the clips of the trial back to back without a gap. The clips that may come next are kept
// mounted and preloaded behind the current one; a new clip only comes to the front once it is
// really playing, so the last frame of the previous one covers the switch.
export function useAdReel(options: AdReelOptions): AdReel {
  // The handlers below outlive a render: they read the latest options from here.
  const live = useRef(options);
  live.current = options;
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const { src, upcoming, volume, muted, loop } = options;
  const [shown, setShown] = useState(src);
  const [blocked, setBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({ elapsed: 0, duration: 0 });

  const begin = useCallback((video: HTMLVideoElement) => {
    setPaused(false);
    startAdVideo(video, () => live.current.onSoundBlocked(), setBlocked);
  }, []);

  useEffect(() => {
    const video = videos.current.get(src);
    if (!video) return;
    const resumeAt = live.current.startAt;
    video.loop = live.current.loop;
    video.muted = live.current.muted;
    video.volume = clampVolume(live.current.volume);
    // A preloaded clip already sits at its start: seeking it again would stall the switch.
    if (Math.abs(video.currentTime - resumeAt) > 0.05) video.currentTime = resumeAt;
    begin(video);
  }, [src, begin]);

  useEffect(() => {
    for (const [name, video] of videos.current) {
      video.volume = clampVolume(volume);
      video.muted = muted;
      if (name === src) video.loop = loop;
    }
  }, [src, volume, muted, loop]);

  // The clip in front keeps playing until the next one has taken its place.
  useEffect(() => {
    for (const [name, video] of videos.current) {
      if (name !== shown && name !== src) video.pause();
    }
  }, [shown, src]);

  const names = useMemo(() => [...new Set([shown, src, ...upcoming])], [shown, src, upcoming]);
  const clips = names.map(
    (name): AdReelClip => ({
      src: name,
      front: name === shown,
      attach: (video) => {
        if (video) videos.current.set(name, video);
        else videos.current.delete(name);
      },
      onPlaying: () => {
        if (name === live.current.src) setShown(name);
      },
      onTimeUpdate: (event) => {
        if (name !== live.current.src) return;
        const video = event.currentTarget;
        setTime({ elapsed: video.currentTime, duration: video.duration || 0 });
        if (video.currentTime > 0) live.current.onTime(video.currentTime);
      },
      onEnded: () => {
        if (name === live.current.src) live.current.onEnded();
      },
      onError: () => {
        if (name === live.current.src) live.current.onFailed();
      },
    }),
  );

  const start = useCallback(() => {
    const video = videos.current.get(live.current.src);
    if (video) begin(video);
  }, [begin]);

  const togglePause = useCallback(() => {
    const video = videos.current.get(live.current.src);
    if (!video) return;
    if (video.paused) return begin(video);
    video.pause();
    setPaused(true);
  }, [begin]);

  const seek = useCallback((seconds: number) => {
    const video = videos.current.get(live.current.src);
    if (!video || !Number.isFinite(video.duration)) return;
    const to = Math.min(Math.max(0, seconds), Math.max(0, video.duration - 0.05));
    video.currentTime = to;
    setTime({ elapsed: to, duration: video.duration });
    live.current.onTime(to);
  }, []);

  const skip = useCallback(() => {
    // The skipped clip stops before the next one comes in, so its sound does not run over.
    videos.current.get(live.current.src)?.pause();
    live.current.onEnded();
  }, []);

  return {
    clips,
    blocked,
    paused,
    elapsed: time.elapsed,
    duration: time.duration,
    start,
    togglePause,
    seek,
    skip,
  };
}
