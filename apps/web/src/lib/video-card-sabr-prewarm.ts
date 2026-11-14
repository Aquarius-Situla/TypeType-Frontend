import { resolvePreferredSabrQuality } from "../hooks/use-sabr-playback-config";
import { useSabrAudioStore } from "../stores/sabr-audio-store";
import { useSabrQualityStore } from "../stores/sabr-quality-store";
import type { VideoStream } from "../types/stream";
import type { SettingsItem } from "../types/user";
import { prewarmSabrPlayback } from "./api-sabr-prewarm";
import { defaultSabrAudioTrackId, sabrAudioOptions } from "./sabr-audio";
import {
  defaultSabrItag,
  resolveSabrPlaybackConfig,
  type SabrPlaybackConfig,
  sabrQualityOptions,
} from "./sabr-source";
import { resolveWatchStartTime } from "./watch-resume";

const AUDIO_ONLY_STORAGE_KEY = "typetype-audio-only-playback";

export type VideoCardSabrPrewarm = {
  settings: SettingsItem | undefined;
  token: string | null;
  progressMs: number;
  signal: AbortSignal;
  committed: () => boolean;
};

export function resolveVideoCardSabrConfig(
  stream: VideoStream,
  settings: SettingsItem | undefined,
): SabrPlaybackConfig | null {
  const qualityOptions = sabrQualityOptions(stream);
  const defaultItag = defaultSabrItag(
    qualityOptions,
    resolvePreferredSabrQuality(settings?.defaultQuality ?? "1080p"),
  );
  const qualityState = useSabrQualityStore.getState();
  const selectedItag =
    qualityState.streamId === stream.id &&
    qualityState.manuallySelected &&
    qualityState.selectedItag !== null &&
    qualityOptions.some((option) => option.itag === qualityState.selectedItag)
      ? qualityState.selectedItag
      : defaultItag;
  const audioState = useSabrAudioStore.getState();
  const audioOptions = sabrAudioOptions(stream);
  const defaultTrackId = defaultSabrAudioTrackId(
    stream,
    settings?.defaultAudioLanguage,
    settings?.preferOriginalLanguage ?? true,
  );
  const selectedTrackId =
    audioState.streamId === stream.id &&
    audioOptions.some((option) => option.id === audioState.selectedTrackId)
      ? audioState.selectedTrackId
      : defaultTrackId;
  const storedAudioOnly =
    typeof localStorage === "undefined" ? null : localStorage.getItem(AUDIO_ONLY_STORAGE_KEY);
  const audioOnly =
    storedAudioOnly === null ? (settings?.audioOnlyPlayback ?? false) : storedAudioOnly === "true";
  return resolveSabrPlaybackConfig(stream, selectedItag, selectedTrackId, audioOnly);
}

export async function prewarmVideoCardSabr(
  stream: VideoStream,
  options: VideoCardSabrPrewarm,
): Promise<void> {
  const config = resolveVideoCardSabrConfig(stream, options.settings);
  // The playback session opens the video a second time at the provider: only for a click.
  if (!config || !options.committed()) return;
  const startTimeMs =
    resolveWatchStartTime({
      authenticated: Boolean(options.token),
      progressPending: false,
      savedPositionMs: options.progressMs,
      serverPositionSeconds: stream.startPosition,
      durationSeconds: stream.duration,
    }) ?? 0;
  await prewarmSabrPlayback(config, options.signal, startTimeMs);
}
