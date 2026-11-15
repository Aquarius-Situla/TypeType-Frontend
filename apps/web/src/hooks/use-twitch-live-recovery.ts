import { useCallback, useEffect, useRef, useState } from "react";
import { useServerStatusStore } from "../stores/server-status-store";

const MAX_ATTEMPTS = 6;
const MAX_DELAY_MS = 30_000;

export function useTwitchLiveRecovery(refetch: () => Promise<unknown>) {
  const [retryKey, setRetryKey] = useState(0);
  const [failed, setFailed] = useState(false);
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
    if (timer.current) return;
    if (attempts.current >= MAX_ATTEMPTS) {
      setFailed(true);
      return;
    }
    const delay = Math.min(MAX_DELAY_MS, 1_000 * 2 ** attempts.current);
    attempts.current += 1;
    timer.current = setTimeout(() => {
      timer.current = null;
      void refetchRef.current().finally(() => setRetryKey((key) => key + 1));
    }, delay);
  }, []);

  const retryNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    attempts.current = 0;
    setFailed(false);
    void refetchRef.current().finally(() => setRetryKey((key) => key + 1));
  }, []);

  const serverResumes = useServerStatusStore((state) => state.resumes);
  useEffect(() => {
    if (serverResumes === 0 || attempts.current === 0) return;
    retryNow();
  }, [serverResumes, retryNow]);

  const onPlaying = useCallback(() => {
    attempts.current = 0;
  }, []);

  return { retryKey, failed, retry: retryNow, onError, onPlaying };
}
