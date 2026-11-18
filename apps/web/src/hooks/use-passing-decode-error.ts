import { MediaError } from "@videojs/media";
import { selectError, usePlayer } from "@videojs/react";
import type { HlsJsAdapter } from "@videojs/react/media/hlsjs-video";
import Hls, { type ErrorData } from "hls.js";
import { type RefObject, useEffect, useRef } from "react";

const RESUMED_SECONDS = 1;
const RELOAD_WINDOW_MS = 60_000;
const MAX_RELOADS = 5;

// A fragment hls.js cannot parse (TS packets cut on the way) is a fatal error that stops loading while the buffer
// still plays, so the video froze a few seconds later under the Video.js dialog. Loading again from the current
// position fetches the fragment anew; the dialog closes once the clock moves. Errors that keep coming back stay.
export function usePassingDecodeError(
  enabled: boolean,
  video: RefObject<HTMLVideoElement | null>,
  adapter: RefObject<HlsJsAdapter | null>,
) {
  const errorState = usePlayer(selectError);
  const dismiss = useRef(errorState?.dismissError);
  dismiss.current = errorState?.dismissError;
  const decodeError = errorState?.error?.code === MediaError.MEDIA_ERR_DECODE;

  useEffect(() => {
    const element = video.current;
    if (!enabled || !element) return;
    let engine: Hls | null = null;
    let reloads: number[] = [];
    const onError = (_event: string, data: ErrorData) => {
      if (!data.fatal || data.details !== Hls.ErrorDetails.FRAG_PARSING_ERROR) return;
      const now = performance.now();
      reloads = reloads.filter((at) => now - at < RELOAD_WINDOW_MS);
      if (reloads.length >= MAX_RELOADS) return;
      reloads.push(now);
      engine?.startLoad(element.currentTime);
    };
    const attach = () => {
      const next = adapter.current?.engine ?? null;
      if (next === engine) return;
      engine?.off(Hls.Events.ERROR, onError);
      engine = next;
      engine?.on(Hls.Events.ERROR, onError);
    };
    element.addEventListener("loadedmetadata", attach);
    attach();
    return () => {
      element.removeEventListener("loadedmetadata", attach);
      engine?.off(Hls.Events.ERROR, onError);
    };
  }, [enabled, video, adapter]);

  useEffect(() => {
    const element = video.current;
    if (!enabled || !decodeError || !element) return;
    const from = element.currentTime;
    const check = () => {
      if (Math.abs(element.currentTime - from) >= RESUMED_SECONDS) dismiss.current?.();
    };
    element.addEventListener("timeupdate", check);
    return () => element.removeEventListener("timeupdate", check);
  }, [enabled, decodeError, video]);
}
