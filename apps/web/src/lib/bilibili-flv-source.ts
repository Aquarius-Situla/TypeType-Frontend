import type { VideoStream } from "../types/stream";
import { detectProvider } from "./provider";
import { isMediaHandleUrl, proxyDashManifest } from "./proxy";
import { directProgressiveStreams, hasDirectDashPair } from "./stream-delivery";
import type { MediaSrc } from "./vidstack";

export const BILIBILI_FLV_BLOB_TYPE = "application/x-typetype-bilibili-flv";

export function selectBilibiliFlvUrl(
  stream: VideoStream,
  isLive: boolean,
  hlsFailed = false,
): string | null {
  if (
    !isLive ||
    detectProvider(stream.id) !== "bilibili" ||
    (stream.hlsUrl && !hlsFailed) ||
    hasDirectDashPair(stream)
  ) {
    return null;
  }

  const candidates = directProgressiveStreams(stream).filter(
    (candidate) =>
      isMediaHandleUrl(candidate.url) &&
      (candidate.deliveryMethod === undefined || candidate.deliveryMethod === "progressive"),
  );
  const flv = candidates.find(
    (candidate) => /flv/i.test(candidate.mimeType) || /flv/i.test(candidate.format),
  );
  if (flv) return proxyDashManifest(flv.url);

  if (
    candidates.length !== 1 ||
    candidates[0].mimeType.trim().length > 0 ||
    candidates[0].format.trim().length > 0
  ) {
    return null;
  }
  return proxyDashManifest(candidates[0].url);
}

export function bilibiliFlvMediaSrc(url: string): MediaSrc {
  return {
    src: new Blob([url], { type: BILIBILI_FLV_BLOB_TYPE }),
    type: "video/object",
  };
}
