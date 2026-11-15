import { useCallback, useEffect, useState } from "react";

type PositionRef = {
  current: number;
};

export function playerErrorResumePosition(
  positionMs: number,
  recoveryPositionMs: number | undefined,
  durationMs: number,
): number {
  const candidate =
    recoveryPositionMs !== undefined && Number.isFinite(recoveryPositionMs)
      ? recoveryPositionMs
      : positionMs;
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
      setRetryStartTime(position);
      onError();
    },
    [duration, onError, positionRef],
  );

  return { retryStartTime, handlePlayerError };
}
