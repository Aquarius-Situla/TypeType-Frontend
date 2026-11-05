import { preloadableLazy } from "../lib/preloadable-lazy";

export const LazyPersistentWatchPlayerHost = preloadableLazy(() =>
  import("./persistent-watch-player-host").then((module) => module.PersistentWatchPlayerHost),
);
