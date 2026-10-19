import { useEffect, useState } from "react";
import type { MediaProviderAdapter } from "../lib/vidstack";
import { isAudioProvider, isVideoProvider } from "../lib/vidstack";

export type MediaAttachmentEventName = "emptied" | "loadstart" | "loadedmetadata" | "canplay";

const MEDIA_ATTACHMENT_EVENTS: MediaAttachmentEventName[] = [
  "emptied",
  "loadstart",
  "loadedmetadata",
  "canplay",
];

export function isMediaAttachmentBusy(event: MediaAttachmentEventName): boolean {
  return event === "emptied" || event === "loadstart";
}

export function useSabrPlayerState(
  enabled: boolean,
  onProviderChange: (provider: MediaProviderAdapter | null) => void,
) {
  const [provider, setProvider] = useState<MediaProviderAdapter | null>(null);
  const [seeking, setSeeking] = useState(false);
  const [reattaching, setReattaching] = useState(false);

  const handleProviderChange = (nextProvider: MediaProviderAdapter | null) => {
    onProviderChange(nextProvider);
    setProvider(nextProvider);
  };

  const video = enabled && isVideoProvider(provider) ? provider.video : null;
  const media = isVideoProvider(provider)
    ? provider.video
    : isAudioProvider(provider)
      ? provider.audio
      : null;

  useEffect(() => {
    if (!video) {
      setReattaching(false);
      return;
    }
    const update = (event: Event) => {
      setReattaching(isMediaAttachmentBusy(event.type as MediaAttachmentEventName));
    };
    for (const name of MEDIA_ATTACHMENT_EVENTS) video.addEventListener(name, update);
    return () => {
      for (const name of MEDIA_ATTACHMENT_EVENTS) video.removeEventListener(name, update);
      setReattaching(false);
    };
  }, [video]);

  return { video, media, seeking: seeking || reattaching, setSeeking, handleProviderChange };
}
