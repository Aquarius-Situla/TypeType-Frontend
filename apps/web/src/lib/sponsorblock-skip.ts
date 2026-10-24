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

export function isSponsorBlockEndSkip(endTime: number, duration: number) {
  return (
    duration > 0 && endTime >= duration - END_SKIP_THRESHOLD_SECONDS && endTime <= duration + 30
  );
}

export function sponsorBlockSkipTarget(endTime: number, duration: number) {
  if (isSponsorBlockEndSkip(endTime, duration)) {
    return Math.max(0, duration - END_SKIP_TARGET_OFFSET_SECONDS);
  }
  return Math.max(0, Math.min(duration > 0 ? duration - 1 : endTime, endTime));
}

export function crossedSponsorBlockStart(
  previousTime: number | null,
  currentTime: number,
  startTime: number,
) {
  if (previousTime === null || currentTime <= previousTime) return false;
  // A seek jump (larger than normal continuous playback interval) must not trigger auto-skip
  if (currentTime - previousTime > MAX_PLAYBACK_STEP_SECONDS) return false;
  return previousTime <= startTime + 0.5 && currentTime >= startTime;
}

export function emitSponsorBlockSkip(detail: SponsorBlockSkipNoticeDetail) {
  window.dispatchEvent(new CustomEvent(SPONSORBLOCK_SKIP_EVENT, { detail }));
}

export function finishSponsorBlockEnd(
  media: HTMLMediaElement | null | undefined,
  remote: { pause: () => void; seek?: (seconds: number) => void },
  duration?: number,
) {
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
  } else if (remote.seek && typeof duration === "number" && duration > 0) {
    try {
      remote.seek(duration);
    } catch {
      // ignore
    }
  }
}
