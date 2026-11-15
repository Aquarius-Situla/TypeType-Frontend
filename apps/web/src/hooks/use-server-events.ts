import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { watchServerEvents } from "../lib/server-events";
import { useServerStatusStore } from "../stores/server-status-store";

const LOSS_GRACE_MS = 3_000;

// Playback sources stay out of the refresh: a running player already reconnects on its own, and a new signed
// link would restart it for nothing.
function isPlaybackSource(key: readonly unknown[]): boolean {
  return (
    key[0] === "stream" ||
    key[0] === "stream-bootstrap" ||
    (key[0] === "twitch" && key[1] === "playback")
  );
}

export function useServerEvents() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const store = useServerStatusStore;
    let grace: ReturnType<typeof setTimeout> | undefined;
    const stop = watchServerEvents({
      onHello: (hello) => {
        if (grace) clearTimeout(grace);
        grace = undefined;
        const before = store.getState().resumes;
        store.getState().greeted(hello);
        if (store.getState().resumes !== before)
          void queryClient.invalidateQueries({
            predicate: (query) => !isPlaybackSource(query.queryKey),
          });
      },
      onNotice: (notice) => store.getState().announced(notice),
      onCleared: () => store.getState().cleared(),
      onLost: () => {
        store.getState().lost();
        grace ??= setTimeout(() => {
          grace = undefined;
          store.getState().lossConfirmed();
        }, LOSS_GRACE_MS);
      },
    });
    return () => {
      stop();
      if (grace) clearTimeout(grace);
    };
  }, [queryClient]);
}
