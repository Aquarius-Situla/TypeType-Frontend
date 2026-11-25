import { useCallback, useRef } from "react";
import { useFirstFrameStore } from "../stores/first-frame-store";
import type { VideoStream } from "../types/stream";
import { firstFrameKey } from "./use-after-first-frame";
import { useWatchProgressPersistence } from "./use-watch-progress-persistence";
import { useWatchSessionReporting } from "./use-watch-session-reporting";

type Args = {
  stream: VideoStream;
  isLive: boolean;
  mutate: (positionMs: number, keepalive: boolean) => void;
  onPlay?: () => void;
  onEnded: () => void;
  onTimeUpdate?: (positionMs: number) => void;
};

export function useWatchPlayerEvents({
  stream,
  isLive,
  mutate,
  onPlay,
  onEnded,
  onTimeUpdate,
}: Args) {
  const playbackIntentRef = useRef<boolean | null>(null);
  const streamIdRef = useRef(stream.id);
  const firstFrameMarkedRef = useRef(false);
  if (streamIdRef.current !== stream.id) {
    streamIdRef.current = stream.id;
    playbackIntentRef.current = null;
    firstFrameMarkedRef.current = false;
  }
  const {
    positionRef,
    handleTimeUpdate,
    handlePause,
    handleSeeked,
    handleEnded: persistEnded,
  } = useWatchProgressPersistence({
    durationSec: stream.duration,
    isLive,
    mutate,
  });
  const handleEndedWithPersistence = useCallback(() => {
    persistEnded();
    onEnded();
  }, [onEnded, persistEnded]);
  const sessionReporting = useWatchSessionReporting({
    stream,
    isLive,
    onTimeUpdate: handleTimeUpdate,
    onPause: handlePause,
    onSeeked: handleSeeked,
    onEnded: handleEndedWithPersistence,
  });
  const handlePlay = useCallback(() => {
    playbackIntentRef.current = true;
    onPlay?.();
  }, [onPlay]);
  const handleTrackedPause = useCallback(() => {
    playbackIntentRef.current = false;
    sessionReporting.handlePause();
  }, [sessionReporting.handlePause]);
  return {
    positionRef,
    playbackIntent: () => playbackIntentRef.current,
    handleTimeUpdate: (positionMs: number) => {
      if (!firstFrameMarkedRef.current && positionMs > 0) {
        firstFrameMarkedRef.current = true;
        const key = firstFrameKey(stream.id);
        if (key) useFirstFrameStore.getState().mark(key);
      }
      sessionReporting.handleTimeUpdate(positionMs);
      onTimeUpdate?.(positionMs);
    },
    handlePlay,
    handlePause: handleTrackedPause,
    handleSeeked: sessionReporting.handleSeeked,
    handleEnded: sessionReporting.handleEnded,
  };
}
