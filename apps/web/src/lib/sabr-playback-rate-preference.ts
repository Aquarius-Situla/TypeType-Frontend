const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 16;
export const HOLD_FAST_FORWARD_ATTRIBUTE = "data-hold-fast-forward";

function isValidPlaybackRate(rate: number): boolean {
  return Number.isFinite(rate) && rate >= MIN_PLAYBACK_RATE && rate <= MAX_PLAYBACK_RATE;
}

export class SabrPlaybackRatePreference {
  private preferredRate: number | null = null;

  constructor(initialRate?: number) {
    if (initialRate !== undefined) this.setPreferredRate(initialRate);
  }

  setPreferredRate(rate: number): void {
    if (isValidPlaybackRate(rate)) this.preferredRate = rate;
  }

  initialize(video: HTMLMediaElement): void {
    if (this.preferredRate === null && isValidPlaybackRate(video.playbackRate)) {
      this.preferredRate = video.playbackRate;
    }
  }

  capture(video: HTMLMediaElement, transient: boolean): void {
    if (video.closest(`[${HOLD_FAST_FORWARD_ATTRIBUTE}]`)) return;
    if (!transient && isValidPlaybackRate(video.playbackRate)) {
      this.preferredRate = video.playbackRate;
    }
  }

  apply(video: HTMLMediaElement, transient: boolean): void {
    if (transient || this.preferredRate === null) return;
    video.defaultPlaybackRate = this.preferredRate;
    video.playbackRate = this.preferredRate;
  }
}
