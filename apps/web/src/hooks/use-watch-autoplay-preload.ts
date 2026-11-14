import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { prewarmSabrPlayback } from "../lib/api-sabr-prewarm";
import { canRetryAutoplayPreload, shouldPreloadAutoplayTarget } from "../lib/autoplay-preload";
import { resolveVideoCardSabrConfig } from "../lib/video-card-sabr-prewarm";
import { toWatchSourceUrl } from "../lib/watch-url";
import { useAuth } from "./use-auth";
import { useInstance } from "./use-instance";
import { useSettings } from "./use-settings";
import { streamQueryOptions } from "./use-stream";
import type { AutoplayTarget } from "./use-watch-ended-navigation";

type Args = {
  durationMs: number;
  enabled: boolean;
  target: AutoplayTarget | null;
};

export function useWatchAutoplayPreload({ durationMs, enabled, target }: Args) {
  const queryClient = useQueryClient();
  const { authReady, isAuthed } = useAuth();
  const { isPending: instancePending } = useInstance();
  const { settings, settingsReady } = useSettings();
  const preloadedRef = useRef(new Set<string>());
  const failedAtRef = useRef(new Map<string, number>());
  const activeRef = useRef<AbortController | null>(null);
  const activeTargetIdRef = useRef("");
  const useAuthenticatedStream = isAuthed;
  const ready = authReady && !instancePending && (!isAuthed || settingsReady);
  const targetId = target?.id ?? "";

  useEffect(() => {
    if (activeTargetIdRef.current === targetId) return;
    activeTargetIdRef.current = targetId;
    activeRef.current?.abort();
    activeRef.current = null;
  }, [targetId]);

  useEffect(
    () => () => {
      activeRef.current?.abort();
    },
    [],
  );

  return useCallback(
    (positionMs: number) => {
      if (!shouldPreloadAutoplayTarget(positionMs, durationMs, enabled, Boolean(target))) return;
      if (!target || !ready) return;
      const sourceUrl = toWatchSourceUrl(target.search.v);
      const key = `${sourceUrl}:${useAuthenticatedStream ? "auth" : "anon"}`;
      if (preloadedRef.current.has(key)) return;
      if (!canRetryAutoplayPreload(failedAtRef.current.get(key), Date.now())) return;
      preloadedRef.current.add(key);
      const controller = new AbortController();
      activeRef.current?.abort();
      activeRef.current = controller;
      void queryClient
        .fetchQuery(streamQueryOptions(sourceUrl, useAuthenticatedStream, true, false, true))
        .then((stream) => {
          if (controller.signal.aborted) return;
          const config = resolveVideoCardSabrConfig(stream, settings);
          if (config) {
            return prewarmSabrPlayback(config, controller.signal);
          }
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          preloadedRef.current.delete(key);
          failedAtRef.current.set(key, Date.now());
        })
        .finally(() => {
          if (activeRef.current === controller) activeRef.current = null;
        });
    },
    [durationMs, enabled, queryClient, ready, settings, target, useAuthenticatedStream],
  );
}
