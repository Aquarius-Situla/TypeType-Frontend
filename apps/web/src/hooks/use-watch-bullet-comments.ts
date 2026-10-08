import { useMemo } from "react";
import { detectProvider, supportsBulletComments } from "../lib/provider";
import { normalizeBilibiliTarget, useB2YStore } from "../stores/b2y-store";
import { useBulletComments } from "./use-bullet-comments";

export function useWatchBulletComments(videoUrl: string, hideComments: boolean) {
  const isNicoNico = detectProvider(videoUrl) === "nicovideo";
  const nativeSupported = supportsBulletComments(videoUrl);

  const streamId = useMemo(() => {
    if (!videoUrl) return "";
    const match = videoUrl.match(/[?&]v=([^&#]+)/);
    if (match) return match[1];
    if (!videoUrl.includes("/") && !videoUrl.includes("?")) return videoUrl;
    return videoUrl;
  }, [videoUrl]);

  const b2yLink = useB2YStore((s) => s.links[streamId]);
  const isB2Y = !nativeSupported && Boolean(b2yLink);

  const targetUrl =
    isB2Y && b2yLink ? normalizeBilibiliTarget(b2yLink.bilibiliUrlOrBv) : videoUrl;
  const canLoadBulletComments = nativeSupported || isB2Y;

  const { data: rawComments } = useBulletComments(
    targetUrl,
    canLoadBulletComments && !hideComments,
  );

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
