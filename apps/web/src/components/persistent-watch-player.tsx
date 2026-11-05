import { useRouterState } from "@tanstack/react-router";
import { Suspense, useLayoutEffect } from "react";
import { usePersistentWatchPlayerStore } from "../hooks/use-persistent-watch-player";
import { shouldKeepPersistentPlayerForRoute } from "../lib/persistent-player-navigation";
import { LazyPersistentWatchPlayerHost } from "./lazy-persistent-watch-player-host";

export function PersistentWatchPlayer() {
  const hasEntry = usePersistentWatchPlayerStore((state) => state.entry !== null);
  if (!hasEntry) return null;
  return <PersistentWatchPlayerRouteEntry />;
}

function PersistentWatchPlayerRouteEntry() {
  const href = useRouterState({ select: (state) => state.location.href });
  const entry = usePersistentWatchPlayerStore((state) => state.entry);
  const close = usePersistentWatchPlayerStore((state) => state.close);
  const keepPlayer = entry ? shouldKeepPersistentPlayerForRoute(entry.streamId, href) : true;

  useLayoutEffect(() => {
    if (entry && !keepPlayer) close(entry.owner);
  }, [close, entry, keepPlayer]);

  if (!entry || !keepPlayer) return null;
  const PersistentWatchPlayerHost = LazyPersistentWatchPlayerHost.current();

  return (
    <Suspense fallback={null}>
      <PersistentWatchPlayerHost />
    </Suspense>
  );
}
