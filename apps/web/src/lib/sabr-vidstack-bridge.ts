export type SabrVidstackControls = {
  play: () => Promise<void>;
  pause: (userInitiated?: boolean) => void;
  seek: (seconds: number) => void;
  isTransitioning?: () => boolean;
  isApplyingTransientMediaState?: () => boolean;
};

const controlsByVideo = new WeakMap<HTMLVideoElement, SabrVidstackControls>();
const pendingPlaybackByVideo = new WeakMap<HTMLVideoElement, boolean>();
const pendingSeekTargetByVideo = new WeakMap<HTMLVideoElement, number>();

export function registerSabrVidstackControls(
  video: HTMLVideoElement,
  controls: SabrVidstackControls,
): () => void {
  controlsByVideo.set(video, controls);
  const pendingPlayback = pendingPlaybackByVideo.get(video);
  pendingPlaybackByVideo.delete(video);
  if (pendingPlayback === true) void controls.play().catch(() => {});
  else if (pendingPlayback === false) controls.pause();
  return () => {
    if (controlsByVideo.get(video) !== controls) return;
    controlsByVideo.delete(video);
    pendingSeekTargetByVideo.delete(video);
  };
}

function getSabrVidstackControls(video: HTMLVideoElement): SabrVidstackControls | null {
  return controlsByVideo.get(video) ?? null;
}

export function isSabrPlaybackEventTransient(video: HTMLVideoElement): boolean {
  if (getSabrVidstackControls(video)?.isApplyingTransientMediaState?.() === true) return true;
  // A recovered session briefly detaches the MediaSource; 0 ms at HAVE_NOTHING is not a position.
  return video.readyState === 0;
}

export function requestSabrSeek(video: HTMLVideoElement, seconds: number): boolean {
  const controls = getSabrVidstackControls(video);
  if (!controls || !Number.isFinite(seconds)) return false;
  const target = Math.max(0, seconds);
  pendingSeekTargetByVideo.set(video, target);
  try {
    controls.seek(target);
  } catch (error) {
    pendingSeekTargetByVideo.delete(video);
    throw error;
  }
  return true;
}

export function consumeSabrSeekTarget(video: HTMLVideoElement): number | null {
  const target = pendingSeekTargetByVideo.get(video);
  pendingSeekTargetByVideo.delete(video);
  return target === undefined ? null : Math.round(target * 1000);
}

export function requestSabrVidstackPlayback(
  video: HTMLVideoElement,
  playing: boolean,
  userInitiated = false,
): Promise<void> {
  const controls = getSabrVidstackControls(video);
  const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
  if (!playing && !userInitiated && (hidden || controls?.isTransitioning?.()))
    return Promise.resolve();
  video.autoplay = playing;
  if (!controls) {
    pendingPlaybackByVideo.set(video, playing);
    if (!playing) video.pause();
    return Promise.resolve();
  }
  pendingPlaybackByVideo.delete(video);
  if (playing) return controls.play();
  controls.pause(userInitiated);
  return Promise.resolve();
}
