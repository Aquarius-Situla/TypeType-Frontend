import { isSabrPlaybackEventTransient } from "./sabr-vidstack-bridge";
import { getSponsorBlockEndedPositionMs } from "./sponsorblock-skip";

export function readMediaPositionMs(media: HTMLMediaElement): number {
  const endedPositionMs = getSponsorBlockEndedPositionMs(media);
  if (endedPositionMs !== null) return endedPositionMs;
  return Math.max(0, Math.round(media.currentTime * 1000));
}

export function resolveMediaProgressPosition(
  video: HTMLVideoElement | null,
  currentPositionMs: number,
  requestedPositionMs: number | null = null,
): number | null {
  if (requestedPositionMs !== null) return requestedPositionMs;
  const endedPositionMs = getSponsorBlockEndedPositionMs(video);
  if (endedPositionMs !== null) return endedPositionMs;
  if (video && isSabrPlaybackEventTransient(video)) return null;
  return currentPositionMs;
}
