import { preloadableLazy } from "../lib/preloadable-lazy";

export const LazyWatchLayout = preloadableLazy(() =>
  import("./watch-layout").then((module) => module.WatchLayout),
);
