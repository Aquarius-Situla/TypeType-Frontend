import { useEffect, useMemo } from "react";
import { continuousPlaylist, onceShuffledPlaylist } from "../lib/continuous-playlist";
import { isManagedPlaylistId } from "../lib/playlist-url";
import { toPublicWatchParam } from "../lib/watch-url";
import { useAuthStore } from "../stores/auth-store";
import { usePlaylistSessionStore } from "../stores/playlist-session-store";
import type { WatchPlaylistItem } from "../types/playlist";

const identify = (video: WatchPlaylistItem) => toPublicWatchParam(video.url);

export function usePlaylistShuffle(
  items: WatchPlaylistItem[],
  list: string | undefined,
  shuffle: string | undefined,
  current: string,
) {
  const userId = useAuthStore((state) => state.me?.id ?? "anonymous");
  const session = usePlaylistSessionStore((state) => state.session);
  const setSession = usePlaylistSessionStore((state) => state.setSession);
  const continuous = Boolean(
    shuffle?.startsWith("continuous:") && list && isManagedPlaylistId(list),
  );
  const sessionKey = `${userId}:${list}:${shuffle}`;
  const plan = useMemo(
    () => (continuous ? continuousPlaylist(items, identify, session, sessionKey, current) : null),
    [continuous, current, items, session, sessionKey],
  );
  const videos = plan?.videos ?? (shuffle ? onceShuffledPlaylist(items, identify, shuffle) : items);
  useEffect(() => {
    if (!plan) return;
    const saved = usePlaylistSessionStore.getState().session;
    const unchanged =
      saved.key === plan.session.key && saved.visited.join("|") === plan.session.visited.join("|");
    if (unchanged) return;
    setSession(plan.session);
  }, [plan, setSession]);
  return { plan, videos };
}
