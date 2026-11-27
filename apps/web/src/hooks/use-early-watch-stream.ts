import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { earlyWatchStreamUrl } from "../lib/early-watch-stream";
import { preloadPlaybackRuntime } from "../lib/playback-runtime-preload";
import { sabrBootstrapQueryOptions, streamQueryOptions } from "./use-stream";

/**
 * The watch page asks for its stream only once its own code is loaded and rendered, and a
 * visitor's first page also waits for the instance settings. Asking for the stream and loading
 * the player code as soon as the location changes, with the same query keys as the watch page,
 * saves those round trips: close to a second on a slow device.
 */
export function useEarlyWatchStream(
  pathname: string,
  search: Record<string, unknown>,
  authReady: boolean,
  isAuthed: boolean,
) {
  const queryClient = useQueryClient();
  const url = earlyWatchStreamUrl(pathname, search, authReady);

  useEffect(() => {
    if (url === null) return;
    void queryClient.prefetchQuery(streamQueryOptions(url, isAuthed));
    void preloadPlaybackRuntime(url).catch(() => undefined);
    const bootstrap = sabrBootstrapQueryOptions(url, isAuthed);
    if (bootstrap.enabled) void queryClient.prefetchQuery(bootstrap);
  }, [url, isAuthed, queryClient]);
}
