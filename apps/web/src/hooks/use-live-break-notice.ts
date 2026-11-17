import type { HlsJsAdapter } from "@videojs/react/media/hlsjs-video";
import Hls, { type LevelUpdatedData } from "hls.js";
import { type RefObject, useEffect } from "react";
import { useLiveBreakStore } from "../stores/live-break-store";

const BREAK_CLASS = "com.typetype.ad-break";

// The live service strips the ads Twitch stitches in and marks the break in the playlist: while it lasts the live has
// no new picture, so the player shows its own page instead of a frozen frame.
export function breakEnd(data: LevelUpdatedData, now: number): number | null {
  let end: number | null = null;
  for (const range of Object.values(data.details.dateRanges ?? {})) {
    if (!range || range.class !== BREAK_CLASS || !range.endDate) continue;
    const at = range.endDate.getTime();
    if (at > now && (end === null || at > end)) end = at;
  }
  return end;
}

export function useLiveBreakNotice(
  enabled: boolean,
  video: RefObject<HTMLVideoElement | null>,
  adapter: RefObject<HlsJsAdapter | null>,
) {
  useEffect(() => {
    const element = video.current;
    const setEndsAt = useLiveBreakStore.getState().setEndsAt;
    if (!enabled || !element) return;
    let engine: Hls | null = null;
    const onLevel = (_event: string, data: LevelUpdatedData) =>
      setEndsAt(breakEnd(data, Date.now()));
    const attach = () => {
      const next = adapter.current?.engine ?? null;
      if (next === engine) return;
      engine?.off(Hls.Events.LEVEL_UPDATED, onLevel);
      engine = next;
      engine?.on(Hls.Events.LEVEL_UPDATED, onLevel);
    };
    element.addEventListener("loadedmetadata", attach);
    attach();
    return () => {
      element.removeEventListener("loadedmetadata", attach);
      engine?.off(Hls.Events.LEVEL_UPDATED, onLevel);
      setEndsAt(null);
    };
  }, [enabled, video, adapter]);
}
