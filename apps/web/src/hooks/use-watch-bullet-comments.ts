import { detectProvider, supportsBulletComments } from "../lib/provider";
import { toWatchSourceUrl } from "../lib/watch-url";
import { useBulletComments } from "./use-bullet-comments";

export function useWatchBulletComments(videoUrl: string, enabled = true) {
  const sourceUrl = toWatchSourceUrl(videoUrl);
  const isNicoNico = detectProvider(sourceUrl) === "nicovideo";
  const canLoadBulletComments = supportsBulletComments(sourceUrl);
  const { data: bulletComments } = useBulletComments(sourceUrl, canLoadBulletComments && enabled);

  return { isNicoNico, canLoadBulletComments, bulletComments };
}
