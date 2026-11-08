import { TypeTypeMsePlayer, type TypeTypeMseQuality } from "@typetype/mse";
import { useEffect, useRef, useState } from "react";
import { useLatestValue } from "../hooks/use-latest-value";
import { useSabrEngineHandlers } from "../hooks/use-sabr-engine-handlers";
import { useSabrErrorReporter } from "../hooks/use-sabr-error-reporter";
import { useSabrMediaSettings } from "../hooks/use-sabr-media-settings";
import { useSabrModeSwitch } from "../hooks/use-sabr-mode-switch";
import { useSabrQualitySwitch } from "../hooks/use-sabr-quality-switch";
import { recordClientEvent } from "../lib/client-debug-log";
import { toAbsoluteApiUrl } from "../lib/env";
import { addPlaybackTraceHeader } from "../lib/playback-trace";
import {
  confirmAutoplayOnPlaying,
  guardAutoplay,
  SabrAutoplayAttempt,
  SabrAutoplayDeadline,
} from "../lib/sabr-autoplay";
import { observeSabrMsePlayback } from "../lib/sabr-mse-playback-trace";
import * as sabrNativePause from "../lib/sabr-native-pause";
import { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import { isAbortError } from "../lib/sabr-playback-retry";
import {
  cancelPendingSabrSeek,
  isMediaTimeBuffered,
  positionMs,
  runSabrSeek,
} from "../lib/sabr-player-seek";
import { SabrVideoHandoff } from "../lib/sabr-video-handoff";
import {
  captureSabrVideoHandoffCleanupPosition as captureCleanupPosition,
  registerSabrVideoHandoffPositionCapture as registerPosition,
} from "../lib/sabr-video-handoff-events";
import { followSabrEngineSeeks, registerSabrVidstackControls } from "../lib/sabr-vidstack-bridge";
import { youtubeBackBufferSeconds, youtubeBufferSeconds } from "../lib/youtube-buffer";
import { useAuthStore } from "../stores/auth-store";
import { useYoutubeBufferStore } from "../stores/youtube-buffer-store";
import type { SabrMsePlayerProps } from "./sabr-mse-player-types";
export function SabrMsePlayer({
  config,
  retryKey,
  playbackRatePreference,
  video,
  startTime,
  autoplay,
  initialVolume,
  initialMuted,
  settingsReady,
  onVolumeChange,
  onError,
  onSeekStateChange,
  onModeSwitchChange,
  onSeekReady,
  onPositionReaderChange,
}: SabrMsePlayerProps) {
  const token = useAuthStore((state) => state.token);
  const headersRef = useRef(new Headers());
  token
    ? headersRef.current.set("authorization", `Bearer ${token}`)
    : headersRef.current.delete("authorization");
  const engineRef = useRef<TypeTypeMsePlayer | null>(null);
  const qualityRef = useRef<TypeTypeMseQuality | null>(null);
  const pendingPlayRef = useRef(false);
  const seekingRef = useRef(false);
  const errorReportedRef = useRef(false);
  const videoHandoffRef = useRef(new SabrVideoHandoff());
  const fallbackPlaybackRateRef = useRef(new SabrPlaybackRatePreference());
  const playbackRate = playbackRatePreference ?? fallbackPlaybackRateRef.current;
  const [engineReady, setEngineReady] = useState(false);
  const latestConfig = useLatestValue(config);
  const latestStartTime = useLatestValue(startTime);
  const settingsReadyRef = useRef(settingsReady);
  settingsReadyRef.current = settingsReady;
  const latestHandlers = useLatestValue({
    autoplay,
    onSeekStateChange,
    onModeSwitchChange,
    onSeekReady,
    onPositionReaderChange,
    onVolumeChange,
  });
  const reportError = useSabrErrorReporter(errorReportedRef, onError, video, config);
  const { latestEngineHandlers, setQualityTransitioning } = useSabrEngineHandlers(
    latestHandlers,
    reportError,
  );
  useSabrQualitySwitch(
    config,
    engineReady,
    engineRef,
    qualityRef,
    seekingRef,
    setQualityTransitioning,
  );
  useSabrModeSwitch(config.audioOnly === true, engineRef, seekingRef, latestEngineHandlers);
  useSabrMediaSettings(video, settingsReady, initialVolume, initialMuted);
  useEffect(() => {
    if (!video) return;
    if (retryKey > 0) {
      recordClientEvent("player.sabr_engine_retry", { attempt: retryKey });
    }
    errorReportedRef.current = false;
    const { startTimeMs: initialStartTimeMs, replacingVideo } = videoHandoffRef.current.attach(
      video,
      config.videoId,
      latestStartTime(),
    );
    const autoplayAttempt = new SabrAutoplayAttempt();
    const initialConfig = latestConfig();
    const initialYoutubeLevel = useYoutubeBufferStore.getState().level;
    const initialBufferGoalMs =
      youtubeBufferSeconds(initialYoutubeLevel, video.playbackRate ?? 1) * 1000;
    const initialBackBufferMs = youtubeBackBufferSeconds(initialYoutubeLevel) * 1000;
    const engine = new TypeTypeMsePlayer(video, {
      endpoint: toAbsoluteApiUrl(""),
      videoId: config.videoId,
      videoItag: initialConfig.videoItag,
      audioItag: initialConfig.audioItag,
      audioTrackId: initialConfig.audioTrackId,
      audioOnly: initialConfig.audioOnly,
      isLive: initialConfig.isLive,
      startTimeMs: initialStartTimeMs,
      bufferGoalMs: initialBufferGoalMs,
      backBufferMs: initialBackBufferMs,
      headers: addPlaybackTraceHeader(new Headers(headersRef.current)),
    });
    const syncBufferPolicy = () => {
      const currentLevel = useYoutubeBufferStore.getState().level;
      const currentRate = video.playbackRate;
      const updatableEngine = engine as unknown as {
        updateBufferPolicy?: (options: { bufferGoalMs?: number; backBufferMs?: number }) => void;
      };
      if (typeof updatableEngine.updateBufferPolicy === "function") {
        updatableEngine.updateBufferPolicy({
          bufferGoalMs: youtubeBufferSeconds(currentLevel, currentRate) * 1000,
          backBufferMs: youtubeBackBufferSeconds(currentLevel) * 1000,
        });
      }
    };
    video.addEventListener("ratechange", syncBufferPolicy);
    const unsubYoutubeBuffer = useYoutubeBufferStore.subscribe(syncBufferPolicy);
    const stopPlaybackTrace = observeSabrMsePlayback(video, config.videoId, engine, reportError);
    engineRef.current = engine;
    qualityRef.current = initialConfig;
    let engineLoaded = false;
    const { unregister: unregisterMediaElementObservers, settle: settlePlaybackRate } =
      sabrNativePause.registerSabrPlaybackRateObservers(
        video,
        settingsReadyRef,
        engine,
        latestHandlers,
        playbackRate,
      );
    const offPosition = registerPosition(video, videoHandoffRef.current, config.videoId);
    const offSeekTargets = followSabrEngineSeeks(video, engine);
    const playEngine = () => engine.play().then(settlePlaybackRate);
    playbackRate.initialize(video);
    const unregisterNativePause = sabrNativePause.registerSabrNativePause(
      video,
      engine,
      seekingRef,
      sabrNativePause.createSabrNativePauseHandler(video, pendingPlayRef, autoplayAttempt),
      {
        onNativePlay: () => {
          pendingPlayRef.current = true;
          autoplayAttempt.allow();
          video.autoplay = true;
          if (engineLoaded) void playEngine().catch(() => {});
        },
      },
      pendingPlayRef,
      autoplayAttempt,
    );
    const autoplayDeadline = new SabrAutoplayDeadline(() => {
      if (!autoplayAttempt.expire()) return;
      pendingPlayRef.current = false;
      video.autoplay = false;
      engine.pause();
    });
    const unconfirmAutoplay = confirmAutoplayOnPlaying(video, autoplayAttempt, autoplayDeadline);
    const unguardAutoplay = guardAutoplay(video, autoplayAttempt, () => engine.pause());
    const startAutoplay = () => {
      if (!engineLoaded || video.readyState < 3 || video.ended) return;
      if (!latestHandlers().autoplay && !pendingPlayRef.current) return;
      if (!autoplayAttempt.begin()) return;
      autoplayDeadline.arm();
      void playEngine()
        .then(() => {
          autoplayDeadline.clear();
          if (autoplayAttempt.isExpired) engine.pause();
          else autoplayAttempt.resolve();
        })
        .catch((error: unknown) => {
          autoplayDeadline.clear();
          if (!autoplayAttempt.reject(error)) {
            pendingPlayRef.current = false;
            video.autoplay = false;
          }
        });
    };
    video.addEventListener("canplay", startAutoplay);
    const autoplayTimer = window.setInterval(startAutoplay, 250);
    const unregisterControls = registerSabrVidstackControls(video, {
      play: () => {
        pendingPlayRef.current = true;
        video.autoplay = true;
        if (!engineLoaded) return Promise.resolve();
        return playEngine();
      },
      pause: (userInitiated = false) => {
        if (!userInitiated && pendingPlayRef.current && !autoplayAttempt.isConfirmed) return;
        pendingPlayRef.current = false;
        autoplayAttempt.resolve();
        video.autoplay = false;
        return engine.pause();
      },
      seek: (seconds, options) => {
        const targetMs = Math.max(0, Math.round(seconds * 1000));
        const quiet = options?.quiet ?? isMediaTimeBuffered(video, seconds);
        runSabrSeek(engine, targetMs, seekingRef, reportError, latestHandlers().onSeekStateChange, {
          quiet,
        });
      },
      isTransitioning: () => seekingRef.current,
      isApplyingTransientMediaState: () => engine.isApplyingTransientMediaState(),
    });
    void engine
      .load()
      .then(() => {
        engineLoaded = true;
        setEngineReady(true);
        if (!replacingVideo) settlePlaybackRate();
        startAutoplay();
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) reportError(error);
      });
    latestHandlers().onSeekReady((seconds) => {
      const targetMs = Math.max(0, Math.round(seconds * 1000));
      const quiet = isMediaTimeBuffered(video, seconds);
      runSabrSeek(engine, targetMs, seekingRef, reportError, latestHandlers().onSeekStateChange, {
        quiet,
      });
    });
    latestHandlers().onPositionReaderChange(() => positionMs(video));
    return () => {
      offSeekTargets();
      captureCleanupPosition(video, videoHandoffRef.current, config.videoId);
      stopPlaybackTrace();
      unguardAutoplay();
      unregisterControls();
      unregisterMediaElementObservers();
      unregisterNativePause();
      unconfirmAutoplay();
      offPosition();
      video.removeEventListener("canplay", startAutoplay);
      video.removeEventListener("ratechange", syncBufferPolicy);
      unsubYoutubeBuffer();
      window.clearInterval(autoplayTimer);
      autoplayDeadline.clear();
      engine.destroy();
      engineRef.current = null;
      setEngineReady(false);
      pendingPlayRef.current = false;
      autoplayAttempt.reset();
      cancelPendingSabrSeek(seekingRef);
      seekingRef.current = false;
      latestHandlers().onSeekStateChange(false);
      video.autoplay = false;
      latestHandlers().onPositionReaderChange(null);
    };
  }, [
    config.videoId,
    latestConfig,
    latestHandlers,
    latestStartTime,
    playbackRate,
    reportError,
    retryKey,
    video,
  ]);
  return null;
}
