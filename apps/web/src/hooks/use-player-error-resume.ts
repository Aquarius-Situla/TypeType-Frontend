import { useCallback, useEffect, useState } from "react";

type PositionRef = {
  current: number;
};

export function playerErrorResumePosition(
  positionMs: number,
  recoveryPositionMs: number | undefined,
  durationMs: number,
): number | null {
  const known = recoveryPositionMs !== undefined && Number.isFinite(recoveryPositionMs);
  const candidate = known ? recoveryPositionMs : positionMs;
  if (!known && candidate < 5000) return null;
  if (candidate < 5000 || candidate >= durationMs * 0.95) return 0;
  return Math.round(candidate);
}

export function resolvePlayerRetryStartTime(
  retryStartTime: number | null,
  fallbackStartTime: number,
): number {
  return retryStartTime ?? fallbackStartTime;
}

export function usePlayerErrorResume(
  streamId: string,
  duration: number,
  positionRef: PositionRef,
  onError: () => void,
) {
  const [retryStartTime, setRetryStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (streamId.length > 0) setRetryStartTime(null);
  }, [streamId]);

  const handlePlayerError = useCallback(
    (recoveryPositionMs?: number) => {
      const position = playerErrorResumePosition(
        positionRef.current,
        recoveryPositionMs,
        duration * 1000,
      );
      if (position !== null) setRetryStartTime(position);
      onError();
    },
    [duration, onError, positionRef],
  );

  return { retryStartTime, handlePlayerError };
}
