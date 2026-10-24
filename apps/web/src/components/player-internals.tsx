import { useEffect, useRef } from "react";
import { isIosDevice } from "../lib/ios-device";
import { seekSponsorBlockSegment } from "../lib/sponsorblock-seek";
import { getSponsorBlockEndTime, getSponsorBlockStartTime } from "../lib/sponsorblock-settings";
import {
  clearSponsorBlockEndedPosition,
  crossedSponsorBlockStart,
  emitSponsorBlockSkip,
  finishSponsorBlockEnd,
  isSponsorBlockEndSkip,
  sponsorBlockSkipTarget,
} from "../lib/sponsorblock-skip";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";
import type { SponsorBlockSegmentItem } from "../types/api";

export function SeekBridge({
  onSeekReady,
}: {
  onSeekReady: (seek: (seconds: number) => void) => void;
}) {
  const remote = useMediaRemote();
  const onSeekReadyRef = useRef(onSeekReady);
  onSeekReadyRef.current = onSeekReady;
  useEffect(() => {
    onSeekReadyRef.current((seconds: number) => remote.seek(seconds));
  }, [remote]);
  return null;
}

export function PlayerFocuser() {
  const ios = isIosDevice();
  const player = useMediaPlayer();
  const canPlay = useMediaState("canPlay");
  const focused = useRef(false);
  useEffect(() => {
    if (ios) return;
    if (!canPlay || focused.current || !player?.el) return;
    focused.current = true;
    player.el.focus({ preventScroll: true });
  }, [ios, canPlay, player]);
  return null;
}

export function SponsorBlockSkipper({
  segments,
  muteInsteadOfSkip,
}: {
  segments: SponsorBlockSegmentItem[];
  muteInsteadOfSkip: boolean;
}) {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const canPlay = useMediaState("canPlay");
  const activeMuteRef = useRef<string | null>(null);
  const pendingSkipRef = useRef<{ key: string; startTime: number; endTime: number } | null>(null);
  const skippedSegmentsRef = useRef<Set<string>>(new Set());
  const restoreMutedRef = useRef(false);
  const previousTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (!canPlay) return;
    const root = player?.el;
    if (!root) return;
    const rootElement = root;
    let cleanup: (() => void) | null = null;

    function setMuted(media: HTMLMediaElement, value: boolean) {
      media.muted = value;
      media.dispatchEvent(new Event("volumechange", { bubbles: true }));
    }

    function process(media: HTMLMediaElement) {
      const duration = Number.isFinite(media.duration) ? media.duration : 0;
      const currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0;
      const previousTime = previousTimeRef.current;
      previousTimeRef.current = currentTime;

      if (currentTime < 1 && previousTime !== null && previousTime > 5) {
        clearSponsorBlockEndedPosition(media);
        skippedSegmentsRef.current.clear();
        pendingSkipRef.current = null;
      }

      for (const seg of segments) {
        if (seg.action !== "skip") continue;
        const startTime = getSponsorBlockStartTime(seg, duration);
        const key = `${seg.category}:${seg.startTime}:${seg.endTime}`;
        if (currentTime < startTime - 1) {
          clearSponsorBlockEndedPosition(media);
          skippedSegmentsRef.current.delete(key);
          if (pendingSkipRef.current?.key === key) {
            pendingSkipRef.current = null;
          }
        }
      }

      const pendingSkip = pendingSkipRef.current;
      if (
        pendingSkip &&
        (currentTime >= pendingSkip.endTime - 0.1 ||
          (currentTime < pendingSkip.startTime - 1 &&
            media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA))
      ) {
        pendingSkipRef.current = null;
      }
      let activeMute: string | null = null;
      for (const seg of segments) {
        if (seg.action !== "skip") continue;
        const startTime = getSponsorBlockStartTime(seg, duration);
        const endTime = getSponsorBlockEndTime(seg, duration);
        if (currentTime >= startTime && currentTime < endTime) {
          if (!muteInsteadOfSkip) {
            const key = `${seg.category}:${seg.startTime}:${seg.endTime}`;
            if (pendingSkipRef.current?.key === key || skippedSegmentsRef.current.has(key)) break;
            const crossedStart = crossedSponsorBlockStart(previousTime, currentTime, startTime);
            if (!crossedStart) break;
            const isEndSkip = isSponsorBlockEndSkip(endTime, duration);
            emitSponsorBlockSkip({
              category: seg.category,
              automatic: true,
              toEnd: isEndSkip,
            });
            skippedSegmentsRef.current.add(key);
            pendingSkipRef.current = { key, startTime, endTime };
            if (isEndSkip) {
              finishSponsorBlockEnd(media, remote, duration);
              break;
            }
            seekSponsorBlockSegment(
              media instanceof HTMLVideoElement ? media : null,
              (seconds) => remote.seek(seconds),
              sponsorBlockSkipTarget(endTime, duration),
            );
            break;
          }
          activeMute = `${seg.category}:${seg.startTime}`;
          if (activeMuteRef.current !== activeMute) {
            activeMuteRef.current = activeMute;
            restoreMutedRef.current = !media.muted;
          }
          setMuted(media, true);
          break;
        }
      }
      if (muteInsteadOfSkip && !activeMute && activeMuteRef.current) {
        if (restoreMutedRef.current) setMuted(media, false);
        activeMuteRef.current = null;
        restoreMutedRef.current = false;
      }
    }

    function attach() {
      if (cleanup) return true;
      const media = rootElement.querySelector<HTMLMediaElement>("video,audio");
      if (!media) return false;
      previousTimeRef.current = null;
      skippedSegmentsRef.current.clear();
      const update = () => process(media);
      const seek = () => {
        previousTimeRef.current = Number.isFinite(media.currentTime) ? media.currentTime : 0;
        process(media);
      };
      media.addEventListener("timeupdate", update);
      media.addEventListener("seeking", seek);
      media.addEventListener("durationchange", update);
      media.addEventListener("loadedmetadata", update);
      update();
      cleanup = () => {
        media.removeEventListener("timeupdate", update);
        media.removeEventListener("seeking", seek);
        media.removeEventListener("durationchange", update);
        media.removeEventListener("loadedmetadata", update);
      };
      return true;
    }

    if (attach()) return () => cleanup?.();
    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(rootElement, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [canPlay, muteInsteadOfSkip, player, segments, remote]);
  return null;
}
