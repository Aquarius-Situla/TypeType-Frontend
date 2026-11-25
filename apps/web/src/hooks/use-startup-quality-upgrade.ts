import { useEffect, useState } from "react";
import { useFirstFrameStore } from "../stores/first-frame-store";

const UPGRADE_AFTER_FIRST_FRAME_MS = 1_200;

function youtubeVideoId(url: string): string | null {
  return /[?&]v=([A-Za-z0-9_-]{11})/.exec(url)?.[1] ?? null;
}

/**
 * Whether a video that started at the startup quality may move to the viewer's quality: a moment after its picture
 * started moving, once the startup session has buffered ahead, so the switch plays on from that buffer.
 */
export function useStartupQualityUpgrade(videoUrl: string): boolean {
  const videoId = youtubeVideoId(videoUrl);
  const moving = useFirstFrameStore((state) => videoId !== null && state.videoId === videoId);
  const [upgraded, setUpgraded] = useState<string | null>(null);
  useEffect(() => {
    if (!moving || videoId === null) return;
    const timer = setTimeout(() => setUpgraded(videoId), UPGRADE_AFTER_FIRST_FRAME_MS);
    return () => clearTimeout(timer);
  }, [moving, videoId]);
  return videoId === null || upgraded === videoId;
}
