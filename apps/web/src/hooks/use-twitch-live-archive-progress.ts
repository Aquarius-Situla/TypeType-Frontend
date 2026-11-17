import { useCallback, useEffect, useRef } from "react";
import { liveArchivePositionMs } from "../lib/twitch-live-archive";
import { twitchVodProgressUrl } from "../lib/twitch-vod-progress-url";
import { useSaveProgress } from "./use-progress";

const SAVE_EVERY_MS = 30_000;

type Archive = { id: string; startedAt: string } | undefined;

// Watching a live saves the matching position of its past broadcast, so opening it later goes on from there.
export function useTwitchLiveArchiveProgress(archive: Archive) {
  const save = useSaveProgress(twitchVodProgressUrl(archive?.id ?? ""));
  const mutate = useRef(save.mutate);
  mutate.current = save.mutate;
  const lastSave = useRef(0);
  const watched = useRef(false);
  const startedAt = archive?.startedAt;
  const id = archive?.id;

  const store = useCallback(
    (keepalive: boolean) => {
      if (!id || !startedAt || !watched.current) return;
      const position = liveArchivePositionMs(startedAt, Date.now());
      if (position === null) return;
      lastSave.current = Date.now();
      mutate.current({ position, keepalive });
    },
    [id, startedAt],
  );

  useEffect(() => {
    const leave = () => store(true);
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      store(true);
    };
  }, [store]);

  return useCallback(() => {
    watched.current = true;
    if (Date.now() - lastSave.current >= SAVE_EVERY_MS) store(false);
  }, [store]);
}
