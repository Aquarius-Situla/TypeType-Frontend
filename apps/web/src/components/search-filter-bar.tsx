import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  activeSearchFilterOptions,
  liveSearchCategory,
  searchFilterGroups,
  searchFilterLabel,
  toggleSearchFilter,
} from "../lib/search-filter-selection";
import { m } from "../paraglide/messages.js";
import type { SearchFilterGroup, SearchFilterOption, SearchFiltersResponse } from "../types/api";

function chipClass(active: boolean): string {
  const base =
    "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-fg text-app`
    : `${base} bg-surface-strong text-fg hover:bg-surface-soft`;
}

function isOptionSelected(
  group: SearchFilterGroup,
  option: SearchFilterOption,
  selected: readonly string[],
): boolean {
  if (!option.isDefault) return selected.includes(option.value);
  return !group.options.some(
    (candidate) => !candidate.isDefault && selected.includes(candidate.value),
  );
}

type Props = {
  filters: SearchFiltersResponse;
  contentFilter: string | undefined;
  selectedFilters: readonly string[];
  onContentChange: (value: string | undefined) => void;
  onFiltersChange: (values: string[]) => void;
  onLiveChange: (enabled: boolean) => void;
};

export function SearchFilterBar({
  filters,
  contentFilter,
  selectedFilters,
  onContentChange,
  onFiltersChange,
  onLiveChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const groups = searchFilterGroups(filters);
  const liveCategory = liveSearchCategory(filters);
  const liveSelected =
    liveCategory !== null &&
    contentFilter === liveCategory.contentFilter &&
    selectedFilters.includes(liveCategory.filterValue);
  const activeOptions = activeSearchFilterOptions(groups, selectedFilters).filter(
    (option) => option.value !== liveCategory?.filterValue,
  );
  const contentOptions = filters.contentFilters.filter(
    (option) => !option.isDefault && searchFilterLabel(option.label).toLowerCase() !== "all",
  );

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (contentOptions.length === 0 && groups.length === 0) return null;

  return (
    <div ref={rootRef} className="relative mb-5 border-y border-border py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => onContentChange(undefined)}
            className={chipClass(!contentFilter)}
          >
            {m.admin_users_filter_all()}
          </button>
          {contentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onContentChange(option.value)}
              className={chipClass(contentFilter === option.value)}
            >
              {searchFilterLabel(option.label)}
            </button>
          ))}
          {liveCategory && (
            <button
              type="button"
              onClick={() => onLiveChange(!liveSelected)}
              className={chipClass(liveSelected)}
            >
              {m.ui_live_streams()}
            </button>
          )}
        </div>
        {groups.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
              open || activeOptions.length > 0
                ? "border-fg bg-fg text-app"
                : "border-border-strong bg-surface text-fg hover:bg-surface-strong"
            }`}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>{m.ui_filters()}</span>
            {activeOptions.length > 0 && (
              <span className="min-w-5 rounded bg-app/15 px-1.5 text-center text-xs">
                {activeOptions.length}
              </span>
            )}
          </button>
        )}
      </div>

      {activeOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {activeOptions.map((option) => {
            const group = groups.find((candidate) =>
              candidate.options.some((candidateOption) => candidateOption.value === option.value),
            );
            if (!group) return null;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onFiltersChange(toggleSearchFilter(groups, selectedFilters, group.key, option))
                }
                className="flex h-7 items-center gap-1.5 rounded-md bg-surface-strong px-2.5 text-xs text-fg transition-colors hover:bg-surface-soft"
                title={m.ui_remove_filter({ label: searchFilterLabel(option.label) })}
              >
                {searchFilterLabel(option.label)}
                <X size={13} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={m.ui_search_filters()}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border-strong bg-surface shadow-2xl"
        >
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <h2 className="text-sm font-semibold text-fg">{m.ui_filters()}</h2>
            <div className="flex items-center gap-1">
              {activeOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFiltersChange([])}
                  className="h-8 px-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
                >
                  {m.ui_reset()}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
                title={m.ui_close_filters()}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="max-h-[min(68vh,34rem)] overflow-y-auto px-4">
            {groups.map((group) => (
              <fieldset key={group.key} className="border-b border-border py-4 last:border-b-0">
                <legend className="mb-2.5 text-xs font-semibold uppercase text-fg-muted">
                  {searchFilterLabel(group.label)}
                </legend>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {group.options.map((option) => {
                    const checked = isOptionSelected(group, option, selectedFilters);
                    return (
                      <label
                        key={option.value}
                        className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                          checked
                            ? "bg-surface-strong text-fg"
                            : "text-fg-muted hover:bg-surface-strong/60 hover:text-fg"
                        }`}
                      >
                        <input
                          type={group.multiSelect ? "checkbox" : "radio"}
                          name={group.multiSelect ? undefined : group.key}
                          checked={checked}
                          onChange={() =>
                            onFiltersChange(
                              toggleSearchFilter(groups, selectedFilters, group.key, option),
                            )
                          }
                          className="h-4 w-4 shrink-0 accent-accent"
                        />
                        <span>{searchFilterLabel(option.label)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
