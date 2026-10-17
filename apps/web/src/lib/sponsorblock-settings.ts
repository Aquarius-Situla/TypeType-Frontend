import { m } from "../paraglide/messages.js";
import type { SponsorBlockSegmentItem } from "../types/api";
import type { SettingsItem, SponsorBlockCategoryAction } from "../types/user";

export type SponsorBlockCategory = {
  id: string;
  label: () => string;
  description: () => string;
  color: string;
  defaultAction: SponsorBlockCategoryAction;
};

export const SPONSORBLOCK_CATEGORIES: SponsorBlockCategory[] = [
  {
    id: "sponsor",
    label: () => m.sponsorblock_sponsored_message(),
    description: () => m.sponsorblock_sponsored_message_description(),
    color: "#00d400",
    defaultAction: "auto_skip",
  },
  {
    id: "selfpromo",
    label: () => m.sponsorblock_self_promotion(),
    description: () => m.sponsorblock_self_promotion_description(),
    color: "#ffff00",
    defaultAction: "auto_skip",
  },
  {
    id: "exclusive_access",
    label: () => m.sponsorblock_exclusive_access(),
    description: () => m.sponsorblock_exclusive_access_description(),
    color: "#008a5c",
    defaultAction: "mark_only",
  },
  {
    id: "interaction",
    label: () => m.sponsorblock_interaction_reminder(),
    description: () => m.sponsorblock_interaction_reminder_description(),
    color: "#cc00ff",
    defaultAction: "auto_skip",
  },
  {
    id: "poi_highlight",
    label: () => m.sponsorblock_highlight(),
    description: () => m.sponsorblock_highlight_description(),
    color: "#ff1684",
    defaultAction: "mark_only",
  },
  {
    id: "intro",
    label: () => m.sponsorblock_intermission_or_intro(),
    description: () => m.sponsorblock_intermission_or_intro_description(),
    color: "#00ffff",
    defaultAction: "auto_skip",
  },
  {
    id: "outro",
    label: () => m.sponsorblock_endcards_or_credits(),
    description: () => m.sponsorblock_endcards_or_credits_description(),
    color: "#0202ed",
    defaultAction: "auto_skip",
  },
  {
    id: "preview",
    label: () => m.sponsorblock_preview_or_recap(),
    description: () => m.sponsorblock_preview_or_recap_description(),
    color: "#008fd6",
    defaultAction: "auto_skip",
  },
  {
    id: "filler",
    label: () => m.sponsorblock_tangents_or_jokes(),
    description: () => m.sponsorblock_tangents_or_jokes_description(),
    color: "#7300ff",
    defaultAction: "auto_skip",
  },
  {
    id: "chapter",
    label: () => m.sponsorblock_chapter(),
    description: () => m.sponsorblock_chapter_description(),
    color: "#ffd000",
    defaultAction: "mark_only",
  },
  {
    id: "music_offtopic",
    label: () => m.sponsorblock_music_non_music(),
    description: () => m.sponsorblock_music_non_music_description(),
    color: "#ff9900",
    defaultAction: "auto_skip",
  },
];

export const DEFAULT_SPONSORBLOCK_CATEGORY_ACTIONS = Object.fromEntries(
  SPONSORBLOCK_CATEGORIES.map((category) => [category.id, category.defaultAction]),
);

export function getSponsorBlockCategoryColor(categoryId: string) {
  return SPONSORBLOCK_CATEGORIES.find((category) => category.id === categoryId)?.color;
}

export function getSponsorBlockCategoryLabel(categoryId: string) {
  return (
    SPONSORBLOCK_CATEGORIES.find((category) => category.id === categoryId)?.label() ?? categoryId
  );
}

function isMusicVideo(category: string | undefined) {
  return category?.toLowerCase() === "music";
}

function isFullVideoSponsorBlockSegment(segment: SponsorBlockSegmentItem, duration: number) {
  if (duration <= 0) return false;
  return (
    getSponsorBlockStartTime(segment, duration) <= 5 &&
    getSponsorBlockEndTime(segment, duration) >= duration * 0.9
  );
}

export function getSponsorBlockStartTime(segment: SponsorBlockSegmentItem, duration: number) {
  return shouldNormalizeMilliseconds(segment, duration)
    ? segment.startTime / 1000
    : segment.startTime;
}

export function getSponsorBlockEndTime(segment: SponsorBlockSegmentItem, duration: number) {
  const end = shouldNormalizeMilliseconds(segment, duration)
    ? segment.endTime / 1000
    : segment.endTime;
  return duration > 0 ? Math.min(duration, Math.max(0, end)) : Math.max(0, end);
}

function shouldNormalizeMilliseconds(segment: SponsorBlockSegmentItem, duration: number) {
  return duration > 0 && segment.endTime > duration + 30;
}

export function filterSponsorBlockSegments(
  segments: SponsorBlockSegmentItem[] | undefined,
  settings: SettingsItem,
  duration: number,
) {
  if (!segments || settings.sponsorBlockMode === "disabled") return undefined;
  const minimumSeconds = Math.max(0, settings.sponsorBlockMinimumDuration);
  const visible = segments.filter((segment) => {
    const action = settings.sponsorBlockCategoryActions[segment.category] ?? "mark_only";
    const segmentDuration =
      getSponsorBlockEndTime(segment, duration) - getSponsorBlockStartTime(segment, duration);
    if (action === "disabled" || segmentDuration < minimumSeconds) return false;
    return (
      settings.sponsorBlockShowFullVideoLabels || !isFullVideoSponsorBlockSegment(segment, duration)
    );
  });
  return visible.length > 0 ? visible : undefined;
}

export function filterAutoSkipSponsorBlockSegments(
  segments: SponsorBlockSegmentItem[] | undefined,
  settings: SettingsItem,
  duration: number,
  streamCategory: string | undefined,
) {
  if (!segments || settings.sponsorBlockMode !== "auto_skip") return undefined;
  const skipped = segments.filter((segment) => {
    if (settings.sponsorBlockCategoryActions[segment.category] !== "auto_skip") return false;
    const start = getSponsorBlockStartTime(segment, duration);
    const end = getSponsorBlockEndTime(segment, duration);
    const segmentDuration = end - start;
    if (segmentDuration > 1800 || (duration > 0 && segmentDuration > duration * 0.5)) return false;
    if (
      settings.sponsorBlockManualSkipOnFullVideo &&
      isFullVideoSponsorBlockSegment(segment, duration)
    ) {
      return false;
    }
    if (segment.category !== "music_offtopic") return true;
    return !settings.sponsorBlockSkipNonMusicOnlyOnMusicVideos || isMusicVideo(streamCategory);
  });
  return skipped.length > 0 ? skipped : undefined;
}

export function filterManualSponsorBlockSegments(
  segments: SponsorBlockSegmentItem[] | undefined,
  settings: SettingsItem,
  duration: number,
) {
  if (!segments || !settings.sponsorBlockManualSkipOnFullVideo) return undefined;
  const manual = segments.filter((segment) => isFullVideoSponsorBlockSegment(segment, duration));
  return manual.length > 0 ? manual : undefined;
}
