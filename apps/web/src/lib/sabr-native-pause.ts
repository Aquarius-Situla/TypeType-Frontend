import { isPendingSabrSeekTarget, subscribeSabrSeekTarget } from "./sabr-vidstack-bridge";

export type SabrNativePauseState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "seeking"
  | "buffering"
  | "ended"
  | "error"
  | "destroyed";

export function shouldHandleSabrNativePause(input: {
  paused: boolean;
  state: SabrNativePauseState;
  seeking: boolean;
  applyingTransientMediaState: boolean;
  ended?: boolean;
}): boolean {
  if (!input.paused || input.seeking || input.applyingTransientMediaState || input.ended)
    return false;
  return input.state === "playing" || input.state === "buffering";
}

type SabrNativePauseEngine = {
  snapshot: () => { state: SabrNativePauseState };
  isApplyingTransientMediaState: () => boolean;
  isInternalSeekPosition?: (positionMs: number) => boolean;
  pause: () => void;
};

export type SabrNativeControlCallbacks = {
  onNativePlay?: () => void;
  onNativeSeek?: (seconds: number) => void;
  onNativeScrubStart?: () => void;
};

type SabrAutoplayAttempt = { resolve: () => unknown };

const NATIVE_SCRUB_PAUSE_GRACE_MS = 300;
const NATIVE_SCRUB_RESUME_WINDOW_MS = 2_000;
const NATIVE_SCRUB_SEEK_DEBOUNCE_MS = 80;

export function createSabrNativePauseHandler(
  video: HTMLVideoElement,
  pendingPlay: { current: boolean },
  autoplayAttempt: SabrAutoplayAttempt,
): () => void {
  return () => {
    pendingPlay.current = false;
    autoplayAttempt.resolve();
    video.autoplay = false;
  };
}

export function registerSabrNativePause(
  video: HTMLVideoElement,
  engine: SabrNativePauseEngine,
  seeking: { current: boolean },
  onHandled: () => void,
  callbacks?: SabrNativeControlCallbacks,
): () => void {
  let pauseTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let seekTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let pausedFromPlayingAt: number | null = null;
  let restorePlayingOnSeek = false;

  const clearPauseTimer = () => {
    if (pauseTimer === null) return;
    globalThis.clearTimeout(pauseTimer);
    pauseTimer = null;
  };

  const clearSeekTimer = () => {
    if (seekTimer === null) return;
    globalThis.clearTimeout(seekTimer);
    seekTimer = null;
  };

  const commitPause = () => {
    pauseTimer = null;
    if (
      video.ended ||
      !shouldHandleSabrNativePause({
        paused: video.paused,
        state: engine.snapshot().state,
        seeking: seeking.current || Boolean(video.seeking),
        applyingTransientMediaState: engine.isApplyingTransientMediaState(),
        ended: video.ended,
      })
    ) {
      return;
    }
    onHandled();
    engine.pause();
  };

  const nativePause = () => {
    if (
      video.ended ||
      !shouldHandleSabrNativePause({
        paused: video.paused,
        state: engine.snapshot().state,
        seeking: seeking.current || Boolean(video.seeking),
        applyingTransientMediaState: engine.isApplyingTransientMediaState(),
        ended: video.ended,
      })
    ) {
      return;
    }
    if (!callbacks) {
      onHandled();
      engine.pause();
      return;
    }
    pausedFromPlayingAt = Date.now();
    clearPauseTimer();
    pauseTimer = globalThis.setTimeout(commitPause, NATIVE_SCRUB_PAUSE_GRACE_MS);
  };

  const nativePlay = () => {
    clearPauseTimer();
    pausedFromPlayingAt = null;
    if (video.ended || !callbacks?.onNativePlay || engine.isApplyingTransientMediaState()) return;
    if (engine.snapshot().state === "playing") return;
    callbacks.onNativePlay();
  };

  const nativeSeeking = () => {
    clearPauseTimer();
    if (!callbacks?.onNativeSeek) return;
    const currentSeconds = video.currentTime;
    if (!Number.isFinite(currentSeconds)) return;
    const currentMs = Math.max(0, Math.round(currentSeconds * 1000));
    if (
      engine.isApplyingTransientMediaState() ||
      engine.isInternalSeekPosition?.(currentMs) === true
    ) {
      return;
    }
    if (
      pausedFromPlayingAt !== null &&
      Date.now() - pausedFromPlayingAt <= NATIVE_SCRUB_RESUME_WINDOW_MS
    ) {
      restorePlayingOnSeek = true;
      pausedFromPlayingAt = null;
    }
    if (isPendingSabrSeekTarget(video, currentSeconds)) {
      if (restorePlayingOnSeek) {
        restorePlayingOnSeek = false;
        callbacks.onNativePlay?.();
      }
      return;
    }
    callbacks.onNativeScrubStart?.();
    clearSeekTimer();
    seekTimer = globalThis.setTimeout(() => {
      seekTimer = null;
      const targetSeconds = Number.isFinite(video.currentTime) ? video.currentTime : currentSeconds;
      if (restorePlayingOnSeek) {
        restorePlayingOnSeek = false;
        callbacks.onNativePlay?.();
      }
      callbacks.onNativeSeek?.(targetSeconds);
    }, NATIVE_SCRUB_SEEK_DEBOUNCE_MS);
  };

  const offSeekTarget = subscribeSabrSeekTarget(video, () => {
    clearPauseTimer();
    if (video.ended) return;
    if (
      pausedFromPlayingAt !== null &&
      Date.now() - pausedFromPlayingAt <= NATIVE_SCRUB_RESUME_WINDOW_MS
    ) {
      pausedFromPlayingAt = null;
      restorePlayingOnSeek = false;
      callbacks?.onNativePlay?.();
    }
  });

  video.addEventListener("pause", nativePause, true);
  video.addEventListener("play", nativePlay, true);
  video.addEventListener("seeking", nativeSeeking, true);
  return () => {
    offSeekTarget();
    clearPauseTimer();
    clearSeekTimer();
    video.removeEventListener("pause", nativePause, true);
    video.removeEventListener("play", nativePlay, true);
    video.removeEventListener("seeking", nativeSeeking, true);
  };
}

type SabrPlaybackEngine = { isApplyingTransientMediaState: () => boolean };
type SabrPlaybackRate = {
  capture: (video: HTMLVideoElement, initial: boolean) => void;
  apply: (video: HTMLVideoElement, initial: boolean) => void;
};
type SabrPlaybackHandlers = () => {
  onVolumeChange?: (volume: number, muted: boolean) => void;
};

export function registerSabrPlaybackRateObservers(
  video: HTMLVideoElement,
  settingsReady: { current: boolean },
  engine: SabrPlaybackEngine,
  latestHandlers: SabrPlaybackHandlers,
  playbackRate: SabrPlaybackRate,
): { unregister: () => void; settle: () => void } {
  let playbackRateSettled = false;
  const volumeChange = () => {
    if (!settingsReady.current || engine.isApplyingTransientMediaState()) return;
    latestHandlers().onVolumeChange?.(video.volume, video.muted);
  };
  const rateChange = () => {
    playbackRate.capture(video, !playbackRateSettled || engine.isApplyingTransientMediaState());
  };
  video.addEventListener("volumechange", volumeChange);
  video.addEventListener("ratechange", rateChange);
  return {
    unregister: () => {
      video.removeEventListener("volumechange", volumeChange);
      video.removeEventListener("ratechange", rateChange);
    },
    settle: () => {
      if (engine.isApplyingTransientMediaState()) return;
      playbackRate.apply(video, false);
      playbackRateSettled = true;
    },
  };
}
