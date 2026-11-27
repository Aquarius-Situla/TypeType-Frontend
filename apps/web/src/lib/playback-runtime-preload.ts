import { LazyPersistentWatchPlayerHost } from "../components/lazy-persistent-watch-player-host";
import { LazyWatchLayout } from "../components/lazy-watch-layout";
import { detectProvider } from "./provider";
import { loadDashMedia, loadHlsMedia } from "./videojs-media-loaders";

const runtimes = new Map<string, Promise<unknown>>();

export function preloadPlaybackRuntime(sourceUrl: string): Promise<unknown> {
  const cacheKey = detectProvider(sourceUrl) ?? "default";
  const existing = runtimes.get(cacheKey);
  if (existing) return existing;

  const tasks: Promise<unknown>[] = [
    LazyWatchLayout.preload(),
    LazyPersistentWatchPlayerHost.preload(),
  ];
  if (cacheKey === "nicovideo") tasks.push(loadHlsMedia());
  if (cacheKey === "bilibili") tasks.push(loadDashMedia());

  const runtime = Promise.all(tasks);
  runtimes.set(cacheKey, runtime);
  return runtime;
}
