import { useSettings } from "../hooks/use-settings";
import { SPONSORBLOCK_CATEGORIES, type SponsorBlockCategory } from "../lib/sponsorblock-settings";
import { m } from "../paraglide/messages.js";
import type { SponsorBlockCategoryAction, SponsorBlockMode } from "../types/user";
import { AdModeRow } from "./settings-ad-mode";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

function actions(): { value: SponsorBlockCategoryAction; label: string }[] {
  return [
    { value: "auto_skip", label: m.portability_skip() },
    { value: "mark_only", label: m.ui_mark() },
    { value: "disabled", label: m.settings_sponsorblock_hide() },
  ];
}

function modes(): { value: SponsorBlockMode; label: string; description: string }[] {
  return [
    {
      value: "auto_skip",
      label: m.portability_skip(),
      description: m.ui_use_category_rules_for_automatic_skips(),
    },
    {
      value: "mark_only",
      label: m.ui_mark(),
      description: m.ui_show_matching_segments_without_skipping(),
    },
    { value: "disabled", label: m.ui_off(), description: m.ui_ignore_all_sponsorblock_data() },
  ];
}

function globalCategoryActions(action: SponsorBlockCategoryAction) {
  const actions: Record<string, SponsorBlockCategoryAction> = {};
  for (const category of SPONSORBLOCK_CATEGORIES) {
    actions[category.id] = action;
  }
  return actions;
}

function GlobalMode() {
  const { settings, update } = useSettings();
  const options = modes();
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-fg">{m.ui_sponsorblock_behavior()}</span>
        <span className="text-xs text-fg-soft">
          {m.ui_global_behavior_first_then_category_rules_decide_what_gets_skipped_or()}
        </span>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = settings.sponsorBlockMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                update.mutate({
                  sponsorBlockMode: option.value,
                  sponsorBlockCategoryActions: globalCategoryActions(option.value),
                })
              }
              className={`typetype-adaptive-control min-w-0 rounded-sm border px-3 py-2 text-left transition-colors ${
                selected
                  ? "border-fg-soft text-fg"
                  : "border-border text-fg-muted hover:border-fg-soft hover:text-fg"
              }`}
            >
              <span className="typetype-adaptive-label block text-xs font-medium">
                {option.label}
              </span>
              <span className="typetype-adaptive-label mt-1 block text-[11px] leading-4 text-fg-soft">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      <AdModeRow />
    </div>
  );
}

function CategoryAction({ category }: { category: SponsorBlockCategory }) {
  const { settings, update } = useSettings();
  const options = actions();
  const value = settings.sponsorBlockCategoryActions[category.id] ?? category.defaultAction;
  return (
    <div className="grid min-w-0 gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-center">
      <div className="flex min-w-0 gap-3">
        <span
          className="mt-1 h-3 w-3 flex-shrink-0 rounded-full border border-border"
          style={{ backgroundColor: category.color }}
        />
        <div className="typetype-adaptive-label min-w-0">
          <div className="text-sm text-fg">{category.label()}</div>
          <div className="text-xs leading-5 text-fg-soft">{category.description()}</div>
        </div>
      </div>
      <div className="typetype-adaptive-segmented rounded-sm border border-border p-1">
        {options.map((action) => {
          const selected = action.value === value;
          return (
            <button
              key={action.value}
              type="button"
              onClick={() =>
                update.mutate({
                  sponsorBlockCategoryActions: {
                    ...settings.sponsorBlockCategoryActions,
                    [category.id]: action.value,
                  },
                })
              }
              className={`typetype-adaptive-control rounded-sm px-1 py-1.5 text-[11px] transition-colors ${
                selected ? "bg-fg/10 text-fg" : "text-fg-soft hover:text-fg"
              }`}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExtraToggles() {
  const { settings, update } = useSettings();
  const toggles = [
    ["sponsorBlockShowCurrentSegment", m.ui_show_current_segment_next_to_time()],
    ["sponsorBlockShowChapters", m.ui_show_sponsorblock_chapters()],
    ["sponsorBlockShowFullVideoLabels", m.ui_show_full_video_labels()],
    ["sponsorBlockManualSkipOnFullVideo", m.ui_manual_skip_full_video_labels()],
    ["sponsorBlockSkipNonMusicOnlyOnMusicVideos", m.ui_skip_non_music_on_music_videos()],
    ["sponsorBlockMuteInsteadOfSkip", m.ui_mute_segments_instead_of_skipping()],
  ] as const;
  return toggles.map(([key, label]) => (
    <div key={key} className={`${ROW} text-left text-sm text-fg`}>
      <span className="typetype-adaptive-label flex min-w-0 flex-1">{label}</span>
      <ToggleSwitch
        checked={settings[key]}
        ariaLabel={label}
        onClick={() => update.mutate({ [key]: !settings[key] })}
      />
    </div>
  ));
}

export function SettingsSponsorBlockPreferences() {
  const { settings, update } = useSettings();
  return (
    <>
      <GlobalMode />
      <div className="py-2 text-[11px] font-medium uppercase tracking-wider text-fg-soft">
        {m.ui_sponsorblock_categories()}
      </div>
      {SPONSORBLOCK_CATEGORIES.map((category) => (
        <CategoryAction key={category.id} category={category} />
      ))}
      <div className="py-2 text-[11px] font-medium uppercase tracking-wider text-fg-soft">
        {m.ui_advanced_display()}
      </div>
      <div className={ROW}>
        <span className="typetype-adaptive-label flex min-w-0 flex-1 text-sm text-fg">
          {m.ui_minimum_segment_duration()}
        </span>
        <input
          type="number"
          min="0"
          value={settings.sponsorBlockMinimumDuration}
          onChange={(event) =>
            update.mutate({ sponsorBlockMinimumDuration: Number(event.currentTarget.value) })
          }
          className="typetype-adaptive-control w-20 shrink-0 rounded-sm border border-border bg-app px-2 py-1 text-right text-sm text-fg"
        />
      </div>
      <ExtraToggles />
    </>
  );
}
