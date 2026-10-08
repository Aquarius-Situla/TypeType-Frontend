import { useMemo } from "react";
import { detectProvider, supportsBulletComments } from "../lib/provider";
import { toWatchSourceUrl } from "../lib/watch-url";
import { normalizeBilibiliTarget, useB2YStore } from "../stores/b2y-store";
import { useBulletComments } from "./use-bullet-comments";

export function useWatchBulletComments(videoUrl: string, enabled = true) {
  const sourceUrl = toWatchSourceUrl(videoUrl);
  const isNicoNico = detectProvider(sourceUrl) === "nicovideo";
  const nativeSupported = supportsBulletComments(sourceUrl);

  const streamId = useMemo(() => {
    if (!videoUrl) return "";
    const match = videoUrl.match(/[?&]v=([^&#]+)/);
    if (match) return match[1];
    if (!videoUrl.includes("/") && !videoUrl.includes("?")) return videoUrl;
    return videoUrl;
  }, [videoUrl]);

  const b2yLink = useB2YStore((s) => s.links[streamId]);
  const isB2Y = !nativeSupported && Boolean(b2yLink);

  const targetUrl = isB2Y && b2yLink ? normalizeBilibiliTarget(b2yLink.bilibiliUrlOrBv) : sourceUrl;
  const canLoadBulletComments = nativeSupported || isB2Y;

  const { data: rawComments } = useBulletComments(targetUrl, canLoadBulletComments && enabled);

  const bulletComments = useMemo(() => {
    if (!rawComments) return undefined;
    if (!isB2Y || !b2yLink || b2yLink.offsetSeconds === 0) return rawComments;
    const offsetMs = Math.round(b2yLink.offsetSeconds * 1000);
    return rawComments.map((comment) => ({
      ...comment,
      durationMs: Math.max(0, comment.durationMs + offsetMs),
    }));
  }, [rawComments, isB2Y, b2yLink]);

  return { isNicoNico, canLoadBulletComments, bulletComments, isB2Y, b2yLink };
}
