import { proxyImage } from "./proxy";
import { youtubeVideoId } from "./watch-url";

export function thumbnailCandidates(videoUrl: string, primary: string): string[] {
  const youtubeId = youtubeVideoId(videoUrl);
  const youtube = youtubeId ? proxyImage(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`) : "";
  return [primary, youtube].filter((url, index, all) => url !== "" && all.indexOf(url) === index);
}
