import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { resolveInternalLink } from "../lib/internal-link";
import { useTwitchEnabled } from "./use-twitch";

export function useInternalLink(): (href: string) => boolean {
  const router = useRouter();
  const twitch = useTwitchEnabled();
  return useCallback(
    (href: string) => {
      const path = resolveInternalLink(href, { twitch });
      if (!path) return false;
      router.history.push(path);
      return true;
    },
    [router, twitch],
  );
}
