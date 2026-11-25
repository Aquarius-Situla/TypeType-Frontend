import { useEffect, useState } from "react";
import { useFirstFrameStore } from "../stores/first-frame-store";

const FALLBACK_MS = 2_500;

function youtubeVideoId(url: string): string | null {
  return /[?&]v=([A-Za-z0-9_-]{11})/.exec(url)?.[1] ?? null;
}

/**
 * Whether the rest of a watch page (comments, related videos and their pictures) may load: once the video's
 * first frame moved, so nothing competes with the media for the connection and the main thread. Other providers
 * and a player that never reports go on after a short delay.
 */
export function useAfterFirstFrame(videoUrl: string): boolean {
  const videoId = youtubeVideoId(videoUrl);
  const reached = useFirstFrameStore((state) => videoId !== null && state.videoId === videoId);
  const [timedOut, setTimedOut] = useState<string | null>(null);
  useEffect(() => {
    if (videoId === null) return;
    const timer = setTimeout(() => setTimedOut(videoId), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [videoId]);
  return videoId === null || reached || timedOut === videoId;
}
