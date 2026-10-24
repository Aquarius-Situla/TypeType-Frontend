export const SPONSORBLOCK_SKIP_EVENT = "typetype-sponsorblock-skip";

export type SponsorBlockSkipNoticeDetail = {
  category: string;
  automatic: boolean;
  toEnd: boolean;
};

declare global {
  interface WindowEventMap {
    "typetype-sponsorblock-skip": CustomEvent<SponsorBlockSkipNoticeDetail>;
  }
}

const END_SKIP_THRESHOLD_SECONDS = 0.75;
const END_SKIP_TARGET_OFFSET_SECONDS = 0.35;
const MAX_PLAYBACK_STEP_SECONDS = 3.0;
const endedPositionByMedia = new WeakMap<HTMLMediaElement, number>();

export function isSponsorBlockEndSkip(endTime: number, duration: number): boolean {
  return (
    duration > 0 && endTime >= duration - END_SKIP_THRESHOLD_SECONDS && endTime <= duration + 30
  );
}

export function sponsorBlockSkipTarget(endTime: number, duration: number): number {
  if (isSponsorBlockEndSkip(endTime, duration)) {
    return Math.max(0, duration - END_SKIP_TARGET_OFFSET_SECONDS);
  }
  return Math.max(0, Math.min(duration > 0 ? duration - 1 : endTime, endTime));
}

export function crossedSponsorBlockStart(
  previousTime: number | null,
  currentTime: number,
  startTime: number,
): boolean {
  if (previousTime === null || currentTime <= previousTime) return false;
  // A seek jump (larger than normal continuous playback interval) must not trigger auto-skip
  if (currentTime - previousTime > MAX_PLAYBACK_STEP_SECONDS) return false;
  return previousTime <= startTime + 0.5 && currentTime >= startTime;
}

export function emitSponsorBlockSkip(detail: SponsorBlockSkipNoticeDetail): void {
  window.dispatchEvent(new CustomEvent(SPONSORBLOCK_SKIP_EVENT, { detail }));
}

export function getSponsorBlockEndedPositionMs(
  media: HTMLMediaElement | null | undefined,
): number | null {
  if (!media) return null;
  return endedPositionByMedia.get(media) ?? null;
}

export function clearSponsorBlockEndedPosition(media: HTMLMediaElement | null | undefined): void {
  if (!media) return;
  endedPositionByMedia.delete(media);
}

export function finishSponsorBlockEnd(
  media: HTMLMediaElement | null | undefined,
  remote: { pause: () => void; seek?: (seconds: number) => void },
  duration?: number,
): void {
  const finalDuration =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : media && Number.isFinite(media.duration) && media.duration > 0
        ? media.duration
        : null;
  if (media && finalDuration !== null) {
    endedPositionByMedia.set(media, Math.max(0, Math.round(finalDuration * 1000)));
  }
  try {
    remote.pause();
  } catch {
    // ignore
  }
  if (media) {
    try {
      media.pause();
    } catch {
      // ignore
    }
    media.dispatchEvent(new Event("ended", { bubbles: true }));
  } else if (remote.seek && finalDuration !== null) {
    try {
      remote.seek(finalDuration);
    } catch {
      // ignore
    }
  }
}
