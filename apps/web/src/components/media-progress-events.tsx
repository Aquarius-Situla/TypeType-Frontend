import { useEffect, useRef } from "react";
import { recordClientEvent } from "../lib/client-debug-log";
import { readMediaPositionMs, resolveMediaProgressPosition } from "../lib/media-progress-position";
import { clearVidstackEndedState } from "../lib/player-ended-state";
import { consumeSabrSeekTarget, isSabrPlaybackEventTransient } from "../lib/sabr-vidstack-bridge";
import { clearSponsorBlockEndedPosition } from "../lib/sponsorblock-skip";
import { useMediaPlayer } from "../lib/vidstack";

type Props = {
  suppressPlaybackEvents?: boolean;
  onTimeUpdate?: (positionMs: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeeking?: (positionMs: number) => void;
  onSeeked?: () => void;
  onEnded?: () => void;
  onPositionReaderChange?: (reader: (() => number | null) | null) => void;
};

export function MediaProgressEvents({
  suppressPlaybackEvents = false,
  onTimeUpdate,
  onPlay,
  onPause,
  onSeeking,
  onSeeked,
  onEnded,
  onPositionReaderChange,
}: Props) {
  const player = useMediaPlayer();
  const suppressPlaybackEventsRef = useRef(suppressPlaybackEvents);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekingRef = useRef(onSeeking);
  const onSeekedRef = useRef(onSeeked);
  const onEndedRef = useRef(onEnded);
  const onPositionReaderChangeRef = useRef(onPositionReaderChange);

  suppressPlaybackEventsRef.current = suppressPlaybackEvents;
  onTimeUpdateRef.current = onTimeUpdate;
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onSeekingRef.current = onSeeking;
  onSeekedRef.current = onSeeked;
  onEndedRef.current = onEnded;
  onPositionReaderChangeRef.current = onPositionReaderChange;

  useEffect(() => {
    const root = player?.el;
    if (!root) return;
    const rootElement = root;
    let cleanup: (() => void) | null = null;

    function attach() {
      if (cleanup) return true;
      const media = rootElement.querySelector<HTMLMediaElement>("video,audio");
      if (!media) return false;

      const video = media instanceof HTMLVideoElement ? media : null;
      const reportPosition = (requestedPositionMs: number | null = null) => {
        const positionMs = resolveMediaProgressPosition(
          video,
          readMediaPositionMs(media),
          requestedPositionMs,
        );
        if (positionMs === null) return false;
        onTimeUpdateRef.current?.(positionMs);
        return true;
      };
      const update = () => {
        if (
          Number.isFinite(media.duration) &&
          media.duration > 0 &&
          readMediaPositionMs(media) < (media.duration - 2) * 1000
        ) {
          clearVidstackEndedState(player, media);
        }
        return reportPosition();
      };
      const readPosition = () => readMediaPositionMs(media);
      const suppressPlaybackEvent = () =>
        suppressPlaybackEventsRef.current ||
        (media instanceof HTMLVideoElement && isSabrPlaybackEventTransient(media));
      const play = () => {
        clearSponsorBlockEndedPosition(media);
        update();
        if (suppressPlaybackEvent()) return;
        onPlayRef.current?.();
      };
      const pause = () => {
        update();
        if (suppressPlaybackEvent()) return;
        onPauseRef.current?.();
      };
      const seeked = () => {
        clearSponsorBlockEndedPosition(media);
        if (
          Number.isFinite(media.duration) &&
          media.duration > 0 &&
          media.currentTime < media.duration - 2
        ) {
          clearVidstackEndedState(player, media);
        }
        const requestedPositionMs = video ? consumeSabrSeekTarget(video) : null;
        if (!reportPosition(requestedPositionMs)) return;
        onSeekedRef.current?.();
      };
      const seeking = () => {
        clearSponsorBlockEndedPosition(media);
        if (!update()) return;
        onSeekingRef.current?.(readMediaPositionMs(media));
      };
      const ended = () => {
        const isNearEnd =
          Number.isFinite(media.duration) &&
          media.duration > 0 &&
          readMediaPositionMs(media) >= (media.duration - 2) * 1000;

        if (!isNearEnd) {
          clearVidstackEndedState(player, media);
          window.setTimeout(() => {
            clearVidstackEndedState(player, media);
          }, 0);
          recordClientEvent("media.ended_rejected", {
            currentMs: readMediaPositionMs(media),
            durationMs: Number.isFinite(media.duration) ? Math.round(media.duration * 1000) : null,
            tag: media.tagName,
          });
          return;
        }

        update();
        recordClientEvent("media.ended", {
          currentMs: readMediaPositionMs(media),
          durationMs: Number.isFinite(media.duration) ? Math.round(media.duration * 1000) : null,
          tag: media.tagName,
        });
        if (media.loop) return;
        onEndedRef.current?.();
      };
      const stalled = () => {
        recordClientEvent("media.stalled", {
          currentMs: readMediaPositionMs(media),
          readyState: media.readyState,
          networkState: media.networkState,
          tag: media.tagName,
        });
      };
      const error = () => {
        recordClientEvent("media.error", {
          currentMs: readMediaPositionMs(media),
          code: media.error?.code ?? null,
          readyState: media.readyState,
          networkState: media.networkState,
          tag: media.tagName,
        });
      };

      media.addEventListener("timeupdate", update);
      media.addEventListener("play", play);
      media.addEventListener("pause", pause);
      media.addEventListener("seeking", seeking);
      media.addEventListener("seeked", seeked);
      media.addEventListener("ended", ended);
      media.addEventListener("stalled", stalled);
      media.addEventListener("error", error);
      onPositionReaderChangeRef.current?.(readPosition);
      cleanup = () => {
        onPositionReaderChangeRef.current?.(null);
        media.removeEventListener("timeupdate", update);
        media.removeEventListener("play", play);
        media.removeEventListener("pause", pause);
        media.removeEventListener("seeking", seeking);
        media.removeEventListener("seeked", seeked);
        media.removeEventListener("ended", ended);
        media.removeEventListener("stalled", stalled);
        media.removeEventListener("error", error);
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
  }, [player]);

  return null;
}
