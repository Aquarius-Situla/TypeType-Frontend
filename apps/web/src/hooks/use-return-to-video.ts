import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { usePersistentWatchPlayerStore } from "./use-persistent-watch-player";

// Brings the floating player back to its page: scrolls up when its watch page is still open, navigates otherwise.
export function useReturnToVideo(): (() => void) | null {
  const navigate = useNavigate();
  const entry = usePersistentWatchPlayerStore((state) => state.entry);
  const back = useCallback(() => {
    if (!entry) return;
    if (entry.attached && entry.anchor) window.scrollTo({ top: 0, behavior: "instant" });
    else void navigate({ href: entry.href, resetScroll: true });
  }, [entry, navigate]);
  return entry ? back : null;
}
