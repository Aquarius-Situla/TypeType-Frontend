import type { HlsJsAdapter } from "@videojs/react/media/hlsjs-video";
import { type RefObject, useEffect } from "react";
import { LOW_LATENCY_TARGET } from "../lib/live-latency";

// Once the live plays, low latency moves its target from the safe start to LOW_LATENCY_TARGET; hls.js closes the gap
// by playing slightly faster. The engine only exists once the source loaded, so it is read on the first playing.
export function useLowLatencySettle(
  enabled: boolean,
  src: string,
  video: RefObject<HTMLVideoElement | null>,
  adapter: RefObject<HlsJsAdapter | null>,
) {
  useEffect(() => {
    const element = video.current;
    if (!enabled || !element || !src) return;
    const settle = () => {
      const engine = adapter.current?.engine;
      if (engine) engine.targetLatency = LOW_LATENCY_TARGET;
    };
    element.addEventListener("playing", settle, { once: true });
    return () => element.removeEventListener("playing", settle);
  }, [enabled, src, video, adapter]);
}
