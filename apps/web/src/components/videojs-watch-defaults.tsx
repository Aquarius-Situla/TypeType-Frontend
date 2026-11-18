import { selectAudioTrack, selectTextTrack, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";
import { type AudioPreference, pickAudioTrack, pickSubtitleTrack } from "../lib/video-js-tracks";
import type { SettingsItem } from "../types/user";
import { normalizeLanguageTag } from "./player-language";
import { VideoJsQualityDefault } from "./videojs-quality-default";

type Props = {
  settings: SettingsItem;
  qualityFailed: boolean;
  originalAudioTrackId?: string | null;
  preferredDefaultAudioTrackId?: string | null;
  originalAudioLocale?: string | null;
  onOriginalLanguageUnavailable: () => void;
};

function useAudioDefault(pref: AudioPreference, onOriginalMissing: () => void) {
  const slice = usePlayer(selectAudioTrack);
  const appliedCount = useRef(0);
  const notified = useRef(false);
  const tracks = slice?.audioTrackList;
  const select = slice?.selectAudioTrack;
  const prefRef = useRef(pref);
  prefRef.current = pref;
  const missingRef = useRef(onOriginalMissing);
  missingRef.current = onOriginalMissing;

  useEffect(() => {
    if (!tracks?.length || !select || tracks.length <= appliedCount.current) return;
    appliedCount.current = tracks.length;
    const preference = prefRef.current;
    const languages = new Set(tracks.map((t) => normalizeLanguageTag(t.language)).filter(Boolean));
    const target = pickAudioTrack(tracks, preference);
    const foundOriginal = preference.originalId !== null && target !== null;
    if (preference.forceOriginal && languages.size > 1 && !foundOriginal && !notified.current) {
      notified.current = true;
      missingRef.current();
    }
    if (target && !target.enabled) select(target.id);
  }, [tracks, select]);
}

function useSubtitleDefault(enabled: boolean, language: string | undefined) {
  const slice = usePlayer(selectTextTrack);
  const applied = useRef(false);
  const tracks = slice?.textTrackList;
  const select = slice?.selectSubtitlesTrack;
  useEffect(() => {
    if (applied.current || !tracks?.length || !select) return;
    const target = pickSubtitleTrack(tracks, enabled, language);
    if (!target) return;
    applied.current = true;
    select(target.id);
  }, [tracks, select, enabled, language]);
}

type TrackDefaultsProps = {
  audio: AudioPreference;
  subtitlesEnabled: boolean;
  subtitleLanguage?: string;
  quality?: string;
  onOriginalLanguageUnavailable: () => void;
};

export function VideoJsTrackDefaults({
  audio,
  subtitlesEnabled,
  subtitleLanguage,
  quality,
  onOriginalLanguageUnavailable,
}: TrackDefaultsProps) {
  useAudioDefault(audio, onOriginalLanguageUnavailable);
  useSubtitleDefault(subtitlesEnabled, subtitleLanguage);
  return quality ? <VideoJsQualityDefault quality={quality} /> : null;
}

export function VideoJsWatchDefaults({
  settings,
  qualityFailed,
  originalAudioTrackId,
  preferredDefaultAudioTrackId,
  originalAudioLocale,
  onOriginalLanguageUnavailable,
}: Props) {
  return (
    <VideoJsTrackDefaults
      audio={{
        forceOriginal: true,
        originalId: originalAudioTrackId,
        preferredId: preferredDefaultAudioTrackId,
        originalLocale: originalAudioLocale,
        preferredLanguage: settings.defaultAudioLanguage || undefined,
      }}
      subtitlesEnabled={settings.subtitlesEnabled}
      subtitleLanguage={settings.defaultSubtitleLanguage || undefined}
      quality={qualityFailed ? undefined : settings.defaultQuality}
      onOriginalLanguageUnavailable={onOriginalLanguageUnavailable}
    />
  );
}
