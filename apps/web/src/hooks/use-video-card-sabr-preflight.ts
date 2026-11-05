import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { releaseHoverPreflight, takeHoverPreflight } from "../lib/hover-preflight-slots";
import { preloadPlaybackRuntime } from "../lib/playback-runtime-preload";
import { detectProvider } from "../lib/provider";
import { isUpcomingStream } from "../lib/upcoming-stream";
import { useAuthStore } from "../stores/auth-store";
import type { VideoStream } from "../types/stream";
import type { SettingsItem } from "../types/user";
import { streamQueryOptions } from "./use-stream";

const PREFLIGHT_DELAY_MS = 600;
const PROVIDER_PREFLIGHT_DELAY_MS = 250;

export function useVideoCardPreflight(stream: VideoStream, progressMs: number) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeControllerRef = useRef<AbortController | null>(null);
  const committedRef = useRef(false);
  const prewarmedRef = useRef(false);
  const prefetchableLive =
    stream.isLive === true &&
    stream.requiresMembership !== true &&
    !isUpcomingStream(stream) &&
    detectProvider(stream.id) === "youtube";
  const sabrEnabled =
    stream.isLive !== true &&
    stream.isPostLive !== true &&
    stream.isLiveContent !== true &&
    stream.requiresMembership !== true &&
    detectProvider(stream.id) === "youtube";
  const provider = detectProvider(stream.id);
  const providerPrewarm =
    stream.isLive !== true &&
    stream.isLiveContent !== true &&
    stream.requiresMembership !== true &&
    (provider === "bilibili" || provider === "nicovideo");

  const prewarmProvider = useCallback(
    (preview: boolean) => {
      if (!providerPrewarm || (preview && prewarmedRef.current)) return;
      if (preview && !takeHoverPreflight()) return;
      void preloadPlaybackRuntime(stream.id).catch(() => undefined);
      const authenticated = Boolean(useAuthStore.getState().token);
      void queryClient
        .fetchQuery(streamQueryOptions(stream.id, authenticated, true, false, preview))
        .then(() => {
          prewarmedRef.current = true;
        })
        .catch(() => undefined)
        .finally(() => {
          if (preview) releaseHoverPreflight();
        });
    },
    [providerPrewarm, queryClient, stream.id],
  );

  const preflight = useCallback(() => {
    if (!sabrEnabled || prewarmedRef.current) return;
    const active = activeControllerRef.current;
    if (active && !active.signal.aborted) return;
    const hover = !committedRef.current;
    if (hover && !takeHoverPreflight()) return;

    const controller = new AbortController();
    activeControllerRef.current = controller;
    const token = useAuthStore.getState().token;
    const authenticated = Boolean(token);
    void preloadPlaybackRuntime(stream.id).catch(() => undefined);
    void Promise.all([
      queryClient.fetchQuery(streamQueryOptions(stream.id, authenticated, true, false, hover)),
      import("../lib/video-card-sabr-prewarm"),
    ])
      .then(([fullStream, { prewarmVideoCardSabr }]) => {
        if (controller.signal.aborted) return;
        return prewarmVideoCardSabr(fullStream, {
          settings: queryClient.getQueryData<SettingsItem>(["settings"]),
          token,
          progressMs,
          signal: controller.signal,
          committed: () => committedRef.current,
        });
      })
      .then(() => {
        if (!controller.signal.aborted && committedRef.current) prewarmedRef.current = true;
      })
      .catch(() => undefined)
      .finally(() => {
        if (hover) releaseHoverPreflight();
        if (activeControllerRef.current === controller) activeControllerRef.current = null;
      });
  }, [progressMs, queryClient, sabrEnabled, stream.id]);

  const prefetchLive = useCallback(
    (preview: boolean) => {
      if (!prefetchableLive) return;
      void queryClient.prefetchQuery(
        streamQueryOptions(stream.id, Boolean(useAuthStore.getState().token), true, true, preview),
      );
    },
    [prefetchableLive, queryClient, stream.id],
  );

  const schedule = useCallback(() => {
    if (timerRef.current !== null) return;
    if (providerPrewarm) {
      if (prewarmedRef.current) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        prewarmProvider(true);
      }, PROVIDER_PREFLIGHT_DELAY_MS);
      return;
    }
    if (prefetchableLive) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        prefetchLive(true);
      }, PREFLIGHT_DELAY_MS);
      return;
    }
    if (!sabrEnabled || committedRef.current || prewarmedRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      preflight();
    }, PREFLIGHT_DELAY_MS);
  }, [prefetchLive, prefetchableLive, preflight, prewarmProvider, providerPrewarm, sabrEnabled]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!committedRef.current) {
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    }
  }, []);

  const focus = useCallback(() => {
    if (prefetchableLive) {
      prefetchLive(true);
      return;
    }
    schedule();
  }, [prefetchLive, prefetchableLive, schedule]);

  const commit = useCallback(() => {
    if (providerPrewarm) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      prewarmProvider(false);
      return;
    }
    if (prefetchableLive) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      prefetchLive(false);
      return;
    }
    if (!sabrEnabled) return;
    committedRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    preflight();
  }, [prefetchLive, prefetchableLive, preflight, prewarmProvider, providerPrewarm, sabrEnabled]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (!committedRef.current) activeControllerRef.current?.abort();
    },
    [],
  );

  return { schedule, cancel, focus, commit };
}
