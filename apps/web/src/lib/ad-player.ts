import type { AdProgress } from "./ad-progress";

// What the watch page and the sponsors page hand to either kind of ad.
export type AdPlayerProps = {
  brand: string;
  progress: AdProgress;
  volume: number;
  muted: boolean;
  soundBlocked?: boolean;
  // Played again from the sponsors page rather than before a video.
  replay?: boolean;
  onToggleMute: () => void;
  onVolume: (volume: number) => void;
  onSoundBlocked: () => void;
  onFinish: () => void;
};

export const AD_CHIP = "rounded bg-black/65 text-white ring-1 ring-white/20";

export function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}

// Browsers refuse to start a video with sound before the first gesture on the page. The ad then
// starts muted and reports it, and only shows its own play button when even that is refused.
export function startAdVideo(
  video: HTMLVideoElement,
  onSoundBlocked: () => void,
  setBlocked: (blocked: boolean) => void,
): void {
  setBlocked(false);
  void video.play().catch(() => {
    if (video.muted) return setBlocked(true);
    video.muted = true;
    onSoundBlocked();
    void video.play().catch(() => setBlocked(true));
  });
}
