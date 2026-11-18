import { useState } from "react";
import { useServerStatusStore } from "../stores/server-status-store";

// The chat images go through the server proxy: one that failed during a restart is tried again once it is back.
export function useRetryingImage(): { failed: boolean; onError: () => void } {
  const resumes = useServerStatusStore((state) => state.resumes);
  const [failedAt, setFailedAt] = useState<number | null>(null);
  return { failed: failedAt === resumes, onError: () => setFailedAt(resumes) };
}
