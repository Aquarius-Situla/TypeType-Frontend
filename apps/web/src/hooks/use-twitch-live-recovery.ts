import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ATTEMPTS = 6;
const MAX_DELAY_MS = 30_000;

export function useTwitchLiveRecovery(refetch: () => Promise<unknown>) {
  const [retryKey, setRetryKey] = useState(0);
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onError = useCallback(() => {
    if (timer.current || attempts.current >= MAX_ATTEMPTS) return;
    const delay = Math.min(MAX_DELAY_MS, 1_000 * 2 ** attempts.current);
    attempts.current += 1;
    timer.current = setTimeout(() => {
      timer.current = null;
      void refetchRef.current().finally(() => setRetryKey((key) => key + 1));
    }, delay);
  }, []);

  const onPlaying = useCallback(() => {
    attempts.current = 0;
  }, []);

  return { retryKey, onError, onPlaying };
}
