import { m } from "../paraglide/messages.js";
import type { SearchFilterGroup, SearchFilterOption, SearchFiltersResponse } from "../types/api";

const LABELS: Record<string, () => string> = {
  all: () => m.search_filter_all(),
  short_video: () => m.search_filter_short_video(),
  medium_length: () => m.search_filter_medium_length(),
  long_video: () => m.search_filter_long_video(),
  extra_long: () => m.search_filter_extra_long(),
  sort_overall: () => m.search_filter_sort_relevance(),
  sort_publish_time: () => m.search_filter_sort_upload_date(),
  sort_view: () => m.search_filter_sort_view_count(),
  sort_rating: () => m.search_filter_sort_rating(),
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
  const clean = raw.includes(":") ? (raw.split(":").pop()?.trim() ?? raw) : raw;
  return LABELS[clean]?.() ?? clean;
}

export function filterGroupsFromResponse(
  filters: SearchFiltersResponse | undefined,
): readonly SearchFilterGroup[] {
  if (!filters) return [];
  if (filters.filterGroups && filters.filterGroups.length > 0) return filters.filterGroups;
  if (!filters.sortFilters || filters.sortFilters.length === 0) return [];
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
