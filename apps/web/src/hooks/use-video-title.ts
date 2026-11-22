import { useEffect, useSyncExternalStore } from "react";
import { videoTitles } from "../lib/video-titles";

export function useVideoTitle(id: string): string | null {
  useEffect(() => videoTitles.request(id), [id]);
  return useSyncExternalStore(
    videoTitles.subscribe,
    () => videoTitles.title(id),
    () => null,
  );
}
