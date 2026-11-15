import { includesOriginal, normalizeLanguageTag } from "../components/player-language";

type AudioTrack = { id: string; label: string; language: string };
type TextTrack = { id: string; kind: string; language: string };

export type AudioPreference = {
  forceOriginal: boolean;
  originalId?: string | null;
  preferredId?: string | null;
  originalLocale?: string | null;
  preferredLanguage?: string;
};

export function pickAudioTrack<T extends AudioTrack>(tracks: T[], pref: AudioPreference): T | null {
  if (tracks.length === 0) return null;
  const originalTag = normalizeLanguageTag(pref.originalLocale);
  const preferredTag = normalizeLanguageTag(pref.preferredLanguage);
  const byId = (id: string | null | undefined) =>
    id ? tracks.find((t) => t.id === id) : undefined;
  const byTag = (tag: string) =>
    tag ? tracks.find((t) => normalizeLanguageTag(t.language) === tag) : undefined;
  const original =
    byId(pref.originalId) ?? tracks.find((t) => includesOriginal(t.label)) ?? byTag(originalTag);
  const chosen = pref.forceOriginal
    ? (original ?? byId(pref.preferredId))
    : (byId(pref.preferredId) ?? byId(pref.originalId));
  return chosen ?? byTag(preferredTag) ?? tracks[0] ?? null;
}

export function pickSubtitleTrack<T extends TextTrack>(
  tracks: T[],
  enabled: boolean,
  language: string | undefined,
): T | null {
  if (!enabled) return null;
  return (
    tracks.find(
      (t) =>
        (t.kind === "subtitles" || t.kind === "captions") && (!language || t.language === language),
    ) ?? null
  );
}
