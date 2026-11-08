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
  return input.state === "playing";
}

type SabrNativePauseEngine = {
  snapshot: () => { state: SabrNativePauseState };
  isApplyingTransientMediaState: () => boolean;
  pause: () => void;
};

export type SabrNativeControlCallbacks = {
  onNativePlay?: () => void;
};

type SabrAutoplayAttempt = { resolve: () => unknown; isConfirmed?: boolean };

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
  pendingPlay?: { current: boolean },
  autoplayAttempt?: { isConfirmed: boolean },
): () => void {
  const nativePause = () => {
    if (
      video.ended ||
      (pendingPlay?.current && !autoplayAttempt?.isConfirmed) ||
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

  const nativePlay = () => {
    if (video.ended || !callbacks?.onNativePlay || engine.isApplyingTransientMediaState()) return;
    if (engine.snapshot().state === "playing") return;
    callbacks.onNativePlay();
  };

  video.addEventListener("pause", nativePause, true);
  video.addEventListener("play", nativePlay, true);
  return () => {
    video.removeEventListener("pause", nativePause, true);
    video.removeEventListener("play", nativePlay, true);
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
