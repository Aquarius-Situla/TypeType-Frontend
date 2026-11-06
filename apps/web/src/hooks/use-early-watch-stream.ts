import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { earlyWatchStreamUrl } from "../lib/early-watch-stream";
import { preloadPlaybackRuntime } from "../lib/playback-runtime-preload";
import { sabrBootstrapQueryOptions, streamQueryOptions } from "./use-stream";

/**
 * A visitor's first page waits for the instance settings before the watch page mounts. Asking
 * for the stream and loading the player code meanwhile, with the same query keys as the watch
 * page, saves those round trips.
 */
export function useEarlyWatchStream(
  pathname: string,
  search: Record<string, unknown>,
  authReady: boolean,
  isAuthed: boolean,
  instanceLoading: boolean,
) {
  const queryClient = useQueryClient();
  const url = earlyWatchStreamUrl(pathname, search, authReady, instanceLoading);

  useEffect(() => {
    if (url === null) return;
    void queryClient.prefetchQuery(streamQueryOptions(url, isAuthed));
    void preloadPlaybackRuntime(url).catch(() => undefined);
    const bootstrap = sabrBootstrapQueryOptions(url, isAuthed);
    if (bootstrap.enabled) void queryClient.prefetchQuery(bootstrap);
  }, [url, isAuthed, queryClient]);
}
