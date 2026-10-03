import { useCallback, useEffect, useState } from "react";

function readJobId(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function usePersistedPortabilityJob(
  storageKey: string,
): [string | null, (jobId: string | null) => void] {
  const [jobId, setJobId] = useState<string | null>(() => readJobId(storageKey));
  const eventName = `typetype:persisted-portability-job:${storageKey}`;
  const updateJobId = useCallback(
    (next: string | null) => {
      try {
        if (next) window.localStorage.setItem(storageKey, next);
        else window.localStorage.removeItem(storageKey);
      } catch {
        // Keep the active tab usable when browser storage is unavailable.
      }
      setJobId(next);
      window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
    },
    [eventName, storageKey],
  );

  useEffect(() => {
    const onCustomChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (typeof next === "string" || next === null) setJobId(next);
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey) setJobId(readJobId(storageKey));
    };
    window.addEventListener(eventName, onCustomChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener(eventName, onCustomChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [eventName, storageKey]);

  return [jobId, updateJobId];
}
