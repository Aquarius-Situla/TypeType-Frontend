import { proxyImage } from "../lib/proxy";
import type { ChatEmoteImage } from "../lib/twitch-chat-parts";
import { stillEmoteUrl } from "../lib/twitch-emote-still";
import { useEmoteAnimationStore } from "../stores/twitch-emote-animation-store";

export function useEmoteImageSrc(image: ChatEmoteImage): { src: string; srcSet?: string } {
  const animated = useEmoteAnimationStore((state) => state.animated);
  const pick = (url: string) => proxyImage(animated ? url : stillEmoteUrl(url), "card");
  return { src: pick(image.url), srcSet: image.url2x ? `${pick(image.url2x)} 2x` : undefined };
}
