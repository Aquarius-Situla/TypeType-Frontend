import { useCallback, useEffect, useState } from "react";
import { getPreparedTakeout } from "../lib/youtube-takeout-prepared-store";

export function usePendingYoutubeTakeout(
  ownerId: string | undefined,
): [File | null, (file: File | null) => void] {
  const [saved, setSaved] = useState<{ ownerId: string; file: File | null } | null>(null);
  const setPending = useCallback(
    (file: File | null) => {
      if (ownerId) setSaved({ ownerId, file });
    },
    [ownerId],
  );

  useEffect(() => {
    let current = true;
    if (!ownerId) {
      setSaved(null);
      return () => {
        current = false;
      };
    }
    void getPreparedTakeout(ownerId).then((file) => {
      if (current) setSaved({ ownerId, file });
    });
    return () => {
      current = false;
    };
  }, [ownerId]);

  return [saved && saved.ownerId === ownerId ? saved.file : null, setPending];
}
