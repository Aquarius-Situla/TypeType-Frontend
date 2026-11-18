import { useCallback, useEffect, useRef, useState } from "react";
import { useServerStatusStore } from "../stores/server-status-store";

export function useServerResumeRetry() {
  const resumes = useServerStatusStore((state) => state.resumes);
  const failed = useRef(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (resumes === 0 || !failed.current) return;
    failed.current = false;
    setRetryKey((key) => key + 1);
  }, [resumes]);

  const onError = useCallback(() => {
    failed.current = true;
  }, []);

  return { retryKey, onError };
}
