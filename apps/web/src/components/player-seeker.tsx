import { useEffect, useRef } from "react";
import { recordClientEvent } from "../lib/client-debug-log";
import { useDashPlayerSnapshot } from "../lib/dash-player-store";
import { clearVidstackEndedState } from "../lib/player-ended-state";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";

const SEEK_SETTLE_DELAY_MS = 750;
const MAX_SEEK_APPLIES = 12;

function seekable(media: HTMLMediaElement, target: number) {
  if (media.readyState < 2) return false;
  if (!Number.isFinite(media.duration) || media.duration <= 0 || target > media.duration)
    return false;
  if (media.seekable.length === 0) return true;
  for (let index = 0; index < media.seekable.length; index += 1) {
    if (target >= media.seekable.start(index) && target <= media.seekable.end(index)) return true;
  }
  return false;
}

export function PlayerSeeker({ startTime }: { startTime: number }) {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const canPlay = useMediaState("canPlay");
  const { player: dashPlayer } = useDashPlayerSnapshot();
  const seeked = useRef(false);
  const startTimeRef = useRef(startTime);
  if (startTimeRef.current !== startTime) {
    startTimeRef.current = startTime;
    seeked.current = false;
  }

  useEffect(() => {
    if (startTime <= 0 || seeked.current) return;
    const target = startTime / 1000;
    const root = player?.el;
    let timeout = 0;
    let applying = false;
    let attempts = 0;

    function seekMedia(media: HTMLMediaElement) {
      if (!canPlay || seeked.current || applying || attempts >= MAX_SEEK_APPLIES) return;
      if (!seekable(media, target)) {
        recordClientEvent("player.seek_wait", {
          targetMs: Math.round(target * 1000),
          readyState: media.readyState,
          seekableRanges: media.seekable.length,
        });
        return;
      }
      applying = true;
      attempts += 1;
      if (dashPlayer && typeof dashPlayer.seek === "function" && dashPlayer.isReady?.()) {
        try {
          dashPlayer.seek(target);
        } catch {
          // ignore error
        }
      }
      try {
        media.currentTime = target;
      } catch {
        // ignore
      }
      remote.seek(target);
      clearVidstackEndedState(player, media);
      recordClientEvent("player.seek_apply", {
        targetMs: Math.round(target * 1000),
        currentMs: Math.round(media.currentTime * 1000),
        tag: media.tagName,
      });
      timeout = window.setTimeout(() => {
        applying = false;
        clearVidstackEndedState(player, media);
        if (Math.abs(media.currentTime - target) <= 2.5) {
          recordClientEvent("player.seek_settled", {
            targetMs: Math.round(target * 1000),
            currentMs: Math.round(media.currentTime * 1000),
            tag: media.tagName,
          });
          seeked.current = true;
          return;
        }
        seekMedia(media);
      }, SEEK_SETTLE_DELAY_MS);
    }

    if (!root) return;
    const rootElement = root;
    let cleanup: (() => void) | null = null;

    function attach() {
      if (cleanup) return true;
      const media = rootElement.querySelector<HTMLMediaElement>("video,audio");
      if (!media) return false;
      const seek = () => seekMedia(media);
      const onSeeked = () => {
        if (
          Number.isFinite(media.duration) &&
          media.duration > 0 &&
          media.currentTime < media.duration - 2
        ) {
          clearVidstackEndedState(player, media);
        }
      };
      media.addEventListener("loadedmetadata", seek);
      media.addEventListener("durationchange", seek);
      media.addEventListener("canplay", seek);
      media.addEventListener("progress", seek);
      media.addEventListener("seeked", onSeeked);
      seek();
      cleanup = () => {
        window.clearTimeout(timeout);
        media.removeEventListener("loadedmetadata", seek);
        media.removeEventListener("durationchange", seek);
        media.removeEventListener("canplay", seek);
        media.removeEventListener("progress", seek);
        media.removeEventListener("seeked", onSeeked);
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
  }, [canPlay, dashPlayer, player, remote, startTime]);
  return null;
}
