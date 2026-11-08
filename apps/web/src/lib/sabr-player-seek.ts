import type { TypeTypeMsePlayer } from "@typetype/mse";
import { isAbortError } from "./sabr-playback-retry";

type SeekFlag = { current: boolean };

const seekRevisions = new WeakMap<SeekFlag, number>();

export function positionMs(video: HTMLVideoElement): number {
  return Math.max(0, Math.round(video.currentTime * 1000));
}

export function secondsFromSliderPercent(duration: number, percent: number): number | null {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(percent)) return null;
  return Math.max(0, Math.min(duration, (percent / 100) * duration));
}

export function secondsFromMediaSliderPercent(
  media: Pick<HTMLMediaElement, "duration" | "seekable">,
  percent: number,
): number | null {
  if (!Number.isFinite(percent)) return null;
  const ranges = media.seekable;
  if (ranges.length > 0) {
    const start = ranges.start(0);
    const end = ranges.end(ranges.length - 1);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return start + (Math.max(0, Math.min(100, percent)) / 100) * (end - start);
    }
  }
  return secondsFromSliderPercent(media.duration, percent);
}

export function percentFromMediaSeconds(
  media: Pick<HTMLMediaElement, "duration" | "seekable">,
  seconds: number,
): number | null {
  if (!Number.isFinite(seconds)) return null;
  const ranges = media.seekable;
  const start = ranges.length > 0 ? ranges.start(0) : 0;
  const end = ranges.length > 0 ? ranges.end(ranges.length - 1) : media.duration;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(0, Math.min(100, ((seconds - start) / (end - start)) * 100));
}

export function isMediaTimeBuffered(
  media: Pick<HTMLMediaElement, "buffered"> | null | undefined,
  targetSeconds: number,
  marginSeconds = 0.25,
): boolean {
  if (!media || !Number.isFinite(targetSeconds)) return false;
  const ranges = media.buffered;
  if (!ranges || ranges.length === 0) return false;
  for (let i = 0; i < ranges.length; i++) {
    const start = ranges.start(i);
    const end = ranges.end(i);
    if (targetSeconds >= start && targetSeconds <= end - marginSeconds) {
      return true;
    }
  }
  return false;
}

export function runSabrSeek(
  player: TypeTypeMsePlayer | null,
  position: number,
  flag: SeekFlag,
  onError: (error: unknown) => void,
  onSeekingChange?: (seeking: boolean) => void,
  options?: { quiet?: boolean },
) {
  if (!player) return;
  const revision = (seekRevisions.get(flag) ?? 0) + 1;
  seekRevisions.set(flag, revision);
  if (!flag.current && !options?.quiet) {
    flag.current = true;
    onSeekingChange?.(true);
  }
  void player
    .seek(position)
    .catch((error: unknown) => {
      if (seekRevisions.get(flag) === revision && !isAbortError(error)) onError(error);
    })
    .finally(() => {
      if (seekRevisions.get(flag) !== revision) return;
      if (flag.current) {
        flag.current = false;
        onSeekingChange?.(false);
      }
    });
}

export function cancelPendingSabrSeek(flag: SeekFlag): void {
  seekRevisions.set(flag, (seekRevisions.get(flag) ?? 0) + 1);
}
