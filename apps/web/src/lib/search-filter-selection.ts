import { m } from "../paraglide/messages.js";
import type { SearchFilterGroup, SearchFilterOption, SearchFiltersResponse } from "../types/api";

const LABELS: Record<string, () => string> = {
  sortby: () => m.search_filter_sort_by(),
  upload_date: () => m.search_filter_upload_date(),
  sort_relevance: () => m.search_filter_relevance(),
  sort_rating: () => m.search_filter_rating(),
  sort_view: () => m.search_filter_view_count(),
  past_hour: () => m.search_filter_past_hour(),
  past_day: () => m.search_filter_today(),
  past_week: () => m.search_filter_this_week(),
  past_month: () => m.ui_this_month(),
  past_year: () => m.search_filter_this_year(),
  short_video: () => m.search_filter_short(),
  long_video: () => m.search_filter_long(),
  Ccommons: () => m.search_filter_creative_commons(),
  Hdr: () => "HDR",
  "3d": () => "3D",
  "4k": () => "4K",
  channels: () => "Channels",
  videos: () => "Videos",
  lives: () => "Live",
  animes: () => "Anime",
  movies_and_tv: () => "Movies & TV",
};

export function searchFilterLabel(raw: string): string {
  const afterColon = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
  const value = afterColon.trim();
  if (LABELS[value]) return LABELS[value]();
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function searchFilterGroups(filters: SearchFiltersResponse): SearchFilterGroup[] {
  if (filters.filterGroups && filters.filterGroups.length > 0) return filters.filterGroups;
  if (filters.sortFilters.length === 0) return [];
  const hasDefault = filters.sortFilters.some((option) => option.isDefault);
  return [
    {
      key: "legacy-sort",
      label: m.search_filter_sort_by(),
      multiSelect: false,
      options: filters.sortFilters.map((option, index) => ({
        ...option,
        isDefault: option.isDefault ?? (!hasDefault && index === 0),
      })),
    },
  ];
}

export function sanitizeSearchFilters(
  groups: readonly SearchFilterGroup[],
  selected: readonly string[],
): string[] {
  const requested = new Set(selected);
  return groups.flatMap((group) => {
    const matches = group.options.filter(
      (option) => requested.has(option.value) && !option.isDefault,
    );
    return (group.multiSelect ? matches : matches.slice(0, 1)).map((option) => option.value);
  });
}

export function toggleSearchFilter(
  groups: readonly SearchFilterGroup[],
  selected: readonly string[],
  groupKey: string,
  option: SearchFilterOption,
): string[] {
  const group = groups.find((candidate) => candidate.key === groupKey);
  if (!group) return sanitizeSearchFilters(groups, selected);
  const groupValues = new Set(group.options.map((candidate) => candidate.value));
  const next = selected.filter((value) => !groupValues.has(value));
  if (group.multiSelect) {
    next.push(...selected.filter((value) => groupValues.has(value) && value !== option.value));
  }
  if (!option.isDefault && !selected.includes(option.value)) next.push(option.value);
  return sanitizeSearchFilters(groups, next);
}

export function activeSearchFilterOptions(
  groups: readonly SearchFilterGroup[],
  selected: readonly string[],
): SearchFilterOption[] {
  const values = new Set(sanitizeSearchFilters(groups, selected));
  return groups.flatMap((group) => group.options.filter((option) => values.has(option.value)));
}
