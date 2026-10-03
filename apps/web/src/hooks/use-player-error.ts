import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bilibiliVariantCount } from "../lib/bilibili-manifest";
import { recordClientEvent } from "../lib/client-debug-log";
import { sanitizeVideoContext } from "../lib/debug-sanitize";
import { isIosDevice } from "../lib/ios-device";
import { OfflinePlayerRecovery } from "../lib/offline-player-recovery";
import { detectProvider } from "../lib/provider";
import { claimAutomaticSabrRecovery, resetAutomaticSabrRecovery } from "../lib/sabr-error-recovery";
import {
  directProgressiveStreams,
  hasDirectDashPair,
  hasSabrPlayback,
} from "../lib/stream-delivery";
import { resolveManifestSrc, shouldUseHls } from "../lib/stream-src";
import type { MediaSrc } from "../lib/vidstack";
import type { VideoStream } from "../types/stream";
import { useInstance } from "./use-instance";

type UsePlayerErrorReturn = {
  manifestSrc: MediaSrc;
  manifestLoading: boolean;
  sabrEnabled: boolean;
  playerFailed: boolean;
  qualityFailed: boolean;
  clearFailed: () => void;
  handleError: () => void;
  handleSeeking: (positionMs: number) => void;
  reset: () => void;
  retryKey: number;
  seekStartTime: number | null;
};

export function usePlayerError(stream: VideoStream, isLive: boolean): UsePlayerErrorReturn {
  const debugVideo = sanitizeVideoContext(stream.id) ?? "unknown";
  const provider = detectProvider(stream.id);
  const iosDevice = isIosDevice();
  const { data: instance } = useInstance();
  const playbackSourceId = stream.id;
  const preferServerManifests = instance?.guestAllowed !== false;
  const directDashPair = hasDirectDashPair(stream);
  const hasDirectPlaybackFallback = directDashPair || directProgressiveStreams(stream).length > 0;
  const highQualityEnabled =
    !isLive &&
    !iosDevice &&
    preferServerManifests &&
    !stream.hlsUrl &&
    directDashPair &&
    provider === "youtube";
  const hlsEnabled = shouldUseHls(stream.hlsUrl, isLive, false, directDashPair);
  const [hlsFailed, setHlsFailed] = useState(false);
  const [highQualityFailed, setHighQualityFailed] = useState(false);
  const [qualityFailed, setQualityFailed] = useState(false);
  const [compatibilityFallback, setCompatibilityFallback] = useState(false);
  const [bilibiliVariant, setBilibiliVariant] = useState(0);
  const [playerFailed, setPlayerFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const sabrRecoveryRef = useRef(false);
  const offlineRecoveryRef = useRef<OfflinePlayerRecovery | null>(null);
  if (!offlineRecoveryRef.current) {
    offlineRecoveryRef.current = new OfflinePlayerRecovery();
  }
  const bilibiliVariants =
    provider === "bilibili"
      ? bilibiliVariantCount(stream.videoOnlyStreams ?? [], stream.audioStreams ?? [])
      : 0;
  const isYoutubeLive = provider === "youtube" && isLive;
  const sabrSelected = provider === "youtube" && !isLive;
  const sabrEnabled = sabrSelected && hasSabrPlayback(stream);

  const fallbackSrc = useMemo(
    () =>
      resolveManifestSrc(stream, isLive, qualityFailed, {
        compatibilityMode: compatibilityFallback,
        enableHighQualityPlayback: highQualityEnabled,
        highQualityFailed,
        hlsFailed,
        allowServerManifests: preferServerManifests,
        bilibiliVariant,
      }),
    [
      stream,
      isLive,
      qualityFailed,
      compatibilityFallback,
      highQualityEnabled,
      highQualityFailed,
      hlsFailed,
      preferServerManifests,
      bilibiliVariant,
    ],
  );
  const manifestSrc: MediaSrc = sabrSelected ? { src: "", type: "video/mp4" } : fallbackSrc;
  const missingYoutubeLiveHls = isYoutubeLive && !stream.hlsUrl;
  const handleError = useCallback(() => {
    if (!sabrEnabled && typeof navigator !== "undefined" && !navigator.onLine) {
      offlineRecoveryRef.current?.waitForOnline();
      recordClientEvent("player.network_retry_waiting", { video: debugVideo });
      return;
    }
    if (isYoutubeLive) {
      recordClientEvent("player.hls_failed", { video: debugVideo });
      setPlayerFailed(true);
    } else if (sabrSelected) {
      if (claimAutomaticSabrRecovery(sabrRecoveryRef)) {
        recordClientEvent("player.sabr_recovering", { video: debugVideo });
        setRetryKey((k) => k + 1);
        return;
      }
      recordClientEvent("player.sabr_failed", { video: debugVideo });
      setPlayerFailed(true);
    } else if (hlsEnabled && !hlsFailed) {
      recordClientEvent("player.hls_failed", { video: debugVideo });
      if (!hasDirectPlaybackFallback) {
        setPlayerFailed(true);
        return;
      }
      setHlsFailed(true);
      setRetryKey((k) => k + 1);
    } else if (provider === "bilibili" && bilibiliVariant < bilibiliVariants - 1) {
      recordClientEvent("player.bilibili_variant_failed", { video: debugVideo });
      setBilibiliVariant((variant) => variant + 1);
      setRetryKey((k) => k + 1);
    } else if (highQualityEnabled && !highQualityFailed) {
      recordClientEvent("player.high_quality_failed", { video: debugVideo });
      setHighQualityFailed(true);
      setRetryKey((k) => k + 1);
    } else if (directDashPair && !qualityFailed) {
      recordClientEvent("player.quality_failed", { video: debugVideo });
      setQualityFailed(true);
      setRetryKey((k) => k + 1);
    } else if (!isLive && hasDirectPlaybackFallback && !compatibilityFallback) {
      recordClientEvent("player.compatibility_fallback", { video: debugVideo });
      setCompatibilityFallback(true);
      setRetryKey((k) => k + 1);
    } else {
      recordClientEvent("player.failed", { video: debugVideo });
      setPlayerFailed(true);
    }
  }, [
    debugVideo,
    sabrEnabled,
    hlsEnabled,
    hlsFailed,
    isYoutubeLive,
    sabrSelected,
    hasDirectPlaybackFallback,
    provider,
    bilibiliVariant,
    bilibiliVariants,
    highQualityEnabled,
    highQualityFailed,
    directDashPair,
    qualityFailed,
    compatibilityFallback,
    isLive,
  ]);

  useEffect(() => {
    const handleOnline = () => {
      if (!offlineRecoveryRef.current?.resumeIfOnline(navigator.onLine)) return;
      recordClientEvent("player.network_recovered", { video: debugVideo });
      setPlayerFailed(false);
      setRetryKey((key) => key + 1);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [debugVideo]);

  const reset = useCallback(() => {
    offlineRecoveryRef.current?.reset();
    setHlsFailed(false);
    setHighQualityFailed(false);
    setQualityFailed(false);
    setCompatibilityFallback(false);
    setBilibiliVariant(0);
    setPlayerFailed(false);
    resetAutomaticSabrRecovery(sabrRecoveryRef);
    setRetryKey((k) => k + 1);
  }, []);

  const clearFailed = useCallback(() => {
    offlineRecoveryRef.current?.reset();
    setPlayerFailed(false);
    resetAutomaticSabrRecovery(sabrRecoveryRef);
  }, []);
  useEffect(() => {
    if (playbackSourceId.length === 0) return;
    offlineRecoveryRef.current?.reset();
    setHlsFailed(false);
    setHighQualityFailed(false);
    setQualityFailed(false);
    setCompatibilityFallback(false);
    setBilibiliVariant(0);
    setPlayerFailed(false);
    resetAutomaticSabrRecovery(sabrRecoveryRef);
    setRetryKey(0);
  }, [playbackSourceId]);

  return {
    manifestSrc,
    manifestLoading: false,
    sabrEnabled,
    playerFailed: playerFailed || missingYoutubeLiveHls,
    qualityFailed,
    clearFailed,
    handleError,
    handleSeeking: () => undefined,
    reset,
    retryKey,
    seekStartTime: null,
  };
}
