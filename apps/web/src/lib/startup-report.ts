import { toAbsoluteApiUrl } from "./env";

type Intent = { videoId: string; at: number; warmed: boolean };

let intent: Intent | null = null;

const STEPS: [string, RegExp][] = [
  ["bootstrap", /\/streams\/youtube\/sabr\/bootstrap\?/],
  ["stream", /\/streams\/youtube\/sabr\?/],
  ["create", /\/sabr\/playback\/[A-Za-z0-9_-]{11}\?/],
  ["position", /\/sabr\/playback\/[^/]+\/position$/],
  ["prefetch", /\/sabr\/playback\/[^/]+\/prefetch$/],
  ["window", /\/sabr\/playback\/[^/]+\/segments$/],
  ["init", /\/sabr\/playback\/[^/]+\/\d+\/init/],
  ["segment", /\/sabr\/playback\/[^/]+\/\d+\/segment\//],
];

/** The click (or key press) that opens a video: the origin its start is measured from. */
export function markWatchIntent(videoUrl: string, warmed: boolean): void {
  const videoId = /[?&]v=([A-Za-z0-9_-]{11})/.exec(videoUrl)?.[1];
  if (!videoId) return;
  if (intent?.videoId === videoId && performance.now() - intent.at < 2_000) return;
  intent = { videoId, at: performance.now(), warmed };
}

/**
 * Waits for the first frame of the video, then sends how long it took from the click (or from the page load when
 * the video was opened by its address) with the first request of each step, as the browser timed them.
 */
export function reportStartup(
  video: HTMLVideoElement,
  videoId: string,
  traceId?: string | null,
): () => void {
  const own = intent?.videoId === videoId ? intent : null;
  const origin = own?.at ?? 0;
  intent = null;
  let done = false;
  const send = () => {
    if (done || video.currentTime <= 0) return;
    done = true;
    stop();
    const steps: Record<string, [number, number]> = {};
    for (const entry of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
      if (entry.startTime < origin) continue;
      for (const [name, pattern] of STEPS) {
        if (!steps[name] && pattern.test(entry.name)) {
          steps[name] = [
            Math.round(entry.startTime - origin),
            Math.round(entry.responseEnd - origin),
          ];
        }
      }
    }
    const body = JSON.stringify({
      video: videoId,
      origin: own ? "click" : "page_load",
      firstFrameMs: Math.round(performance.now() - origin),
      warmed: own?.warmed ?? false,
      trace: traceId ?? "",
      steps,
    });
    const url = toAbsoluteApiUrl("/metrics/startup");
    if (!navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
      void fetch(url, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined);
    }
  };
  const stop = () => video.removeEventListener("timeupdate", send);
  video.addEventListener("timeupdate", send);
  return stop;
}
