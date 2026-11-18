type VideoJsSourceKind = "hls" | "dash" | "file" | "sabr";

export type VideoJsSource = { kind: VideoJsSourceKind; src: string; type?: string };

const HLS_TYPES = new Set(["application/x-mpegurl", "application/vnd.apple.mpegurl"]);
const DASH_TYPE = "application/dash+xml";
const FILE_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "audio/webm", "audio/mp4"]);

function kindFromUrl(url: string): VideoJsSourceKind | null {
  if (url.startsWith("data:")) return url.startsWith(`data:${DASH_TYPE}`) ? "dash" : null;
  const path = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mpd")) return "dash";
  if (path.endsWith(".mp4") || path.endsWith(".webm")) return "file";
  return null;
}

function kindFromType(type: string): VideoJsSourceKind | null {
  const normalized = type.toLowerCase();
  if (HLS_TYPES.has(normalized)) return "hls";
  if (normalized === DASH_TYPE) return "dash";
  if (FILE_TYPES.has(normalized)) return "file";
  return null;
}

export function videoJsSource(src: unknown): VideoJsSource | null {
  if (typeof src === "string") {
    const kind = kindFromUrl(src);
    return kind ? { kind, src } : null;
  }
  if (!src || typeof src !== "object" || Array.isArray(src)) return null;
  const value = src as { src?: unknown; type?: unknown };
  if (typeof value.src !== "string") return null;
  const kind = typeof value.type === "string" ? kindFromType(value.type) : kindFromUrl(value.src);
  if (!kind) return null;
  return { kind, src: value.src, type: typeof value.type === "string" ? value.type : undefined };
}

type EngineChoice = {
  engine: string;
  source: unknown;
  sabr: boolean;
  audioOnly: boolean;
};

export function videoJsSourceFor(choice: EngineChoice): VideoJsSource | null {
  if (choice.engine !== "videojs") return null;
  if (choice.sabr) return { kind: "sabr", src: "" };
  return videoJsSource(choice.source);
}
