import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { prewarmSabrPlayback } from "../lib/api-sabr-prewarm";
import { releaseHoverPreflight, takeHoverPreflight } from "../lib/hover-preflight-slots";
import { preloadPlaybackRuntime } from "../lib/playback-runtime-preload";
import { detectProvider } from "../lib/provider";
import { defaultSabrAudioTrackId, sabrAudioOptions } from "../lib/sabr-audio";
import { defaultSabrItag, resolveSabrPlaybackConfig, sabrQualityOptions } from "../lib/sabr-source";
import { isUpcomingStream } from "../lib/upcoming-stream";
import { resolveWatchStartTime } from "../lib/watch-resume";
import { useAuthStore } from "../stores/auth-store";
import { useSabrAudioStore } from "../stores/sabr-audio-store";
import { useSabrQualityStore } from "../stores/sabr-quality-store";
import type { VideoStream } from "../types/stream";
import type { SettingsItem } from "../types/user";
import { resolvePreferredSabrQuality } from "./use-sabr-playback-config";
import { streamQueryOptions } from "./use-stream";

const PREFLIGHT_DELAY_MS = 600;
const AUDIO_ONLY_STORAGE_KEY = "typetype-audio-only-playback";

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
    void queryClient
      .fetchQuery(streamQueryOptions(stream.id, authenticated, true, false, hover))
      .then((fullStream) => {
        if (controller.signal.aborted) return;
        const settings = queryClient.getQueryData<SettingsItem>(["settings"]);
        const qualityOptions = sabrQualityOptions(fullStream);
        const defaultItag = defaultSabrItag(
          qualityOptions,
          resolvePreferredSabrQuality(settings?.defaultQuality ?? "1080p"),
        );
        const qualityState = useSabrQualityStore.getState();
        const selectedItag =
          qualityState.streamId === fullStream.id &&
          qualityState.manuallySelected &&
          qualityState.selectedItag !== null &&
          qualityOptions.some((option) => option.itag === qualityState.selectedItag)
            ? qualityState.selectedItag
            : defaultItag;
        const audioState = useSabrAudioStore.getState();
        const audioOptions = sabrAudioOptions(fullStream);
        const defaultTrackId = defaultSabrAudioTrackId(
          fullStream,
          settings?.defaultAudioLanguage,
          settings?.preferOriginalLanguage ?? true,
        );
        const selectedTrackId =
          audioState.streamId === fullStream.id &&
          audioOptions.some((option) => option.id === audioState.selectedTrackId)
            ? audioState.selectedTrackId
            : defaultTrackId;
        const storedAudioOnly = localStorage.getItem(AUDIO_ONLY_STORAGE_KEY);
        const audioOnly =
          storedAudioOnly === null
            ? (settings?.audioOnlyPlayback ?? false)
            : storedAudioOnly === "true";
        const config = resolveSabrPlaybackConfig(
          fullStream,
          selectedItag,
          selectedTrackId,
          audioOnly,
        );
        // The playback session opens the video a second time at the provider: only for a click.
        if (!config || !committedRef.current) return;
        const startTimeMs =
          resolveWatchStartTime({
            authenticated,
            progressPending: false,
            savedPositionMs: progressMs,
            serverPositionSeconds: fullStream.startPosition,
            durationSeconds: fullStream.duration,
          }) ?? 0;
        return prewarmSabrPlayback(config, token, controller.signal, startTimeMs);
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
  }, [prefetchLive, prefetchableLive, preflight, sabrEnabled]);

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
  }, [prefetchLive, prefetchableLive, preflight, sabrEnabled]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (!committedRef.current) activeControllerRef.current?.abort();
    },
    [],
  );

  return { schedule, cancel, focus, commit };
}
