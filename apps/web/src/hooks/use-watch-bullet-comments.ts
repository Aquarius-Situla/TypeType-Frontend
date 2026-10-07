import { detectProvider, supportsBulletComments } from "../lib/provider";
import { toWatchSourceUrl } from "../lib/watch-url";
import { useBulletComments } from "./use-bullet-comments";

export function useWatchBulletComments(videoUrl: string, hideComments: boolean) {
  const sourceUrl = toWatchSourceUrl(videoUrl);
  const isNicoNico = detectProvider(sourceUrl) === "nicovideo";
  console.log("[useWatchBulletComments]", {
    videoUrl,
    sourceUrl,
    canLoadBulletComments,
    hideComments,
    enabled: canLoadBulletComments && !hideComments,
  });
  const { data: bulletComments, isLoading, isError, error } = useBulletComments(
    sourceUrl,
    canLoadBulletComments && !hideComments,
  );
  console.log("[useWatchBulletComments result]", {
    count: bulletComments?.length,
    isLoading,
    isError,
    error,
  });

  return { isNicoNico, canLoadBulletComments, bulletComments };
}
