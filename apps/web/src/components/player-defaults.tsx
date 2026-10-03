import { useEffect, useRef } from "react";
import { normalizeDefaultPlaybackSpeed } from "../lib/playback-speed";
import { qualityLabelHeight, qualityOptionHeight } from "../lib/player-quality";
import type { SabrPlaybackRatePreference } from "../lib/sabr-playback-rate-preference";
import {
  useAudioOptions,
  useMediaPlayer,
  useMediaState,
  useVideoQualityOptions,
} from "../lib/vidstack";
import {
  hasMultipleLanguageTracks,
  includesOriginal,
  normalizeLanguageTag,
} from "./player-language";

const QUALITY_OPTIONS = { sort: "descending" } as const;

type PlayerDefaultsProps = {
  defaultQuality?: string;
  defaultPlaybackSpeed?: number;
  defaultAudioLanguage?: string;
  preferOriginalLanguage?: boolean;
  requireOriginalLanguage?: boolean;
  onOriginalLanguageUnavailable?: () => void;
  originalAudioTrackId?: string | null;
  preferredDefaultAudioTrackId?: string | null;
  originalAudioLocale?: string | null;
  subtitlesEnabled?: boolean;
  defaultSubtitleLanguage?: string;
};

type PlaybackSpeedDefaultProps = {
  defaultPlaybackSpeed: number;
  preference?: SabrPlaybackRatePreference;
};

export function PlayerDefaults({
  defaultQuality,
  defaultPlaybackSpeed,
  defaultAudioLanguage,
  preferOriginalLanguage,
  requireOriginalLanguage,
  onOriginalLanguageUnavailable,
  originalAudioTrackId,
  preferredDefaultAudioTrackId,
  originalAudioLocale,
  subtitlesEnabled,
  defaultSubtitleLanguage,
}: PlayerDefaultsProps) {
  const canPlay = useMediaState("canPlay");
  const player = useMediaPlayer();
  const qualityOptions = useVideoQualityOptions(QUALITY_OPTIONS);
  const audioOptions = useAudioOptions();
  const textTracks = useMediaState("textTracks");
  const qualityApplied = useRef(false);
  const appliedAudioOptionsCount = useRef(0);
  const subtitleApplied = useRef(false);
  const originalMissingNotified = useRef(false);

  const preferredTag = normalizeLanguageTag(defaultAudioLanguage);
  const originalTag = normalizeLanguageTag(originalAudioLocale);

  useEffect(() => {
    if (!canPlay || qualityApplied.current || !defaultQuality) return;
    const media = player?.el?.querySelector<HTMLMediaElement>("video,audio");
    const currentTime = media && Number.isFinite(media.currentTime) ? media.currentTime : 0;
    if (currentTime > 1.5) {
      qualityApplied.current = true;
      return;
    }
    const defaultHeight = qualityLabelHeight(defaultQuality);
    const exactMatch = qualityOptions.find((o) => o.label === defaultQuality);
    const heightMatch = qualityOptions.find(
      (o) => defaultHeight !== null && qualityOptionHeight(o) === defaultHeight,
    );
    const match = exactMatch ?? heightMatch;
    if (!match) return;
    match.select();
    qualityApplied.current = true;
  }, [canPlay, qualityOptions, defaultQuality, player]);

  useEffect(() => {
    const forceOriginal = requireOriginalLanguage || preferOriginalLanguage;
    const canReapplyOriginalSelection =
      forceOriginal &&
      appliedAudioOptionsCount.current > 0 &&
      audioOptions.length > appliedAudioOptionsCount.current;
    const selectedTrackId = audioOptions.find((option) => option.selected)?.track.id;
    const expectedTrackId = forceOriginal
      ? (originalAudioTrackId ?? preferredDefaultAudioTrackId ?? undefined)
      : (preferredDefaultAudioTrackId ?? undefined);
    const shouldFixMismatchedSelection =
      expectedTrackId !== undefined &&
      expectedTrackId !== null &&
      selectedTrackId !== undefined &&
      selectedTrackId !== expectedTrackId;
    if (
      audioOptions.length === 0 ||
      (appliedAudioOptionsCount.current > 0 &&
        !canReapplyOriginalSelection &&
        !shouldFixMismatchedSelection)
    ) {
      return;
    }

    let match = forceOriginal
      ? (audioOptions.find((option) => option.track.id === originalAudioTrackId) ??
        audioOptions.find((option) => option.track.id === preferredDefaultAudioTrackId) ??
        audioOptions.find((option) => includesOriginal(option.label)) ??
        audioOptions.find((option) => normalizeLanguageTag(option.track.language) === originalTag))
      : (audioOptions.find((option) => option.track.id === preferredDefaultAudioTrackId) ??
        audioOptions.find((option) => option.track.id === originalAudioTrackId));

    const hasMultipleLanguages = hasMultipleLanguageTracks(audioOptions);

    const missingOriginalByContract = forceOriginal && originalAudioTrackId === null;
    const missingOriginalByHeuristic =
      forceOriginal && originalAudioTrackId === undefined && hasMultipleLanguages && !match;
    if (
      (missingOriginalByContract || missingOriginalByHeuristic) &&
      hasMultipleLanguages &&
      !originalMissingNotified.current
    ) {
      originalMissingNotified.current = true;
      onOriginalLanguageUnavailable?.();
    }

    if (!match) {
      match = audioOptions.find(
        (option) => normalizeLanguageTag(option.track.language) === preferredTag,
      );
    }
    if (!match) {
      match = audioOptions[0];
    }
    if (!match || selectedTrackId === match.track.id) return;

    match.select();
    appliedAudioOptionsCount.current = audioOptions.length;
  }, [
    audioOptions,
    originalAudioTrackId,
    preferredDefaultAudioTrackId,
    preferOriginalLanguage,
    requireOriginalLanguage,
    originalTag,
    preferredTag,
    onOriginalLanguageUnavailable,
  ]);

  useEffect(() => {
    if (!canPlay || subtitleApplied.current || !subtitlesEnabled) return;
    for (const track of textTracks) {
      if (track.kind !== "subtitles" && track.kind !== "captions") continue;
      if (defaultSubtitleLanguage && track.language !== defaultSubtitleLanguage) continue;
      track.setMode("showing");
      subtitleApplied.current = true;
      break;
    }
  }, [canPlay, textTracks, subtitlesEnabled, defaultSubtitleLanguage]);

  if (defaultPlaybackSpeed === undefined) return null;
  return <PlayerPlaybackSpeedDefault defaultPlaybackSpeed={defaultPlaybackSpeed} />;
}

export function PlayerPlaybackSpeedDefault({
  defaultPlaybackSpeed,
  preference,
}: PlaybackSpeedDefaultProps) {
  const canPlay = useMediaState("canPlay");
  const player = useMediaPlayer();
  const applied = useRef(false);

  useEffect(() => {
    if (!canPlay || applied.current) return;
    const media = player?.el?.querySelector<HTMLMediaElement>("video,audio");
    if (!media) return;
    if (preference) {
      preference.apply(media, false);
    } else {
      const speed = normalizeDefaultPlaybackSpeed(defaultPlaybackSpeed);
      media.defaultPlaybackRate = speed;
      media.playbackRate = speed;
    }
    applied.current = true;
  }, [canPlay, defaultPlaybackSpeed, player, preference]);

  return null;
}
