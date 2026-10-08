import { Calendar, Compass, Flame, ShieldAlert, Sparkles } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useSubscriptionGroups } from "../hooks/use-subscription-groups";
import { m } from "../paraglide/messages.js";
import { getEntertainmentWeight, useFocusModeStore } from "../stores/focus-mode-store";

const PRESET_DAYS = [7, 30, 90, 180, 365];

export function SettingsFocusMode() {
  const { locale } = useInterfaceLocale();
  const {
    enabled,
    startedAt,
    transitionDays,
    studyGroupId,
    entertainmentGroupId,
    hideOldEntertainmentDays,
    setEnabled,
    setTransitionDays,
    setStudyGroupId,
    setEntertainmentGroupId,
    setHideOldEntertainmentDays,
    resetProgress,
  } = useFocusModeStore();

  const groupsQuery = useSubscriptionGroups();
  const groups = groupsQuery.data ?? [];

  const weight = getEntertainmentWeight({ enabled, startedAt, transitionDays });
  const entertainmentPercentage = Math.round(weight * 100);
  const elapsedDays = Math.floor(Math.max(0, Date.now() - startedAt) / 86_400_000);
  const totalDays = Math.max(1, transitionDays);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-fg flex items-center gap-2">
          <Flame className="h-4 w-4 text-fg" aria-hidden="true" />
          <span>{m.settings_focus_mode_title({}, { locale })}</span>
        </h2>
        <p className="text-xs text-fg-soft leading-relaxed">
          {m.settings_focus_mode_description({}, { locale })}
        </p>
      </div>

      {/* Main Activation Card */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">
              {m.settings_focus_mode_enable({}, { locale })}
            </span>
            <span className="text-xs text-fg-soft">
              {enabled
                ? m.settings_focus_mode_status_active({}, { locale })
                : m.settings_focus_mode_status_disabled({}, { locale })}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? "bg-fg" : "bg-surface-strong"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-app shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="rounded-lg border border-border bg-surface-strong/40 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-fg">
                {m.settings_focus_mode_day_counter(
                  {
                    elapsed: String(Math.min(totalDays, elapsedDays + 1)),
                    total: String(totalDays),
                  },
                  { locale },
                )}
              </span>
              <span className="text-fg font-semibold">
                {m.settings_focus_mode_current_rate(
                  { percent: String(entertainmentPercentage) },
                  { locale },
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
              <div
                className="h-full bg-fg transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((totalDays - weight * totalDays) / totalDays) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-fg-muted pt-1">
              <span>{m.settings_focus_mode_decay_progress({}, { locale })}</span>
              <button
                type="button"
                onClick={resetProgress}
                className="hover:text-fg underline transition-colors"
              >
                {m.settings_focus_mode_reset_button({}, { locale })}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dual Group Configuration */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {/* Study Group */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-fg-muted" />
                {m.settings_focus_mode_study_group({}, { locale })}
              </span>
              <span className="text-xs text-fg-soft">
                {m.settings_focus_mode_study_group_description({}, { locale })}
              </span>
            </div>
            <select
              aria-label={m.settings_focus_mode_study_group({}, { locale })}
              value={studyGroupId ?? ""}
              onChange={(e) => setStudyGroupId(e.target.value || null)}
              className="h-9 rounded-lg border border-border bg-surface-strong px-3 text-xs text-fg sm:w-56"
            >
              <option value="">
                {m.settings_focus_mode_select_group_placeholder({}, { locale })}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.channelCount})
                </option>
              ))}
            </select>
          </div>

          {/* Entertainment Group */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-fg-muted" />
                {m.settings_focus_mode_entertainment_group({}, { locale })}
              </span>
              <span className="text-xs text-fg-soft">
                {m.settings_focus_mode_entertainment_group_description({}, { locale })}
              </span>
            </div>
            <select
              aria-label={m.settings_focus_mode_entertainment_group({}, { locale })}
              value={entertainmentGroupId ?? ""}
              onChange={(e) => setEntertainmentGroupId(e.target.value || null)}
              className="h-9 rounded-lg border border-border bg-surface-strong px-3 text-xs text-fg sm:w-56"
            >
              <option value="">
                {m.settings_focus_mode_select_group_placeholder({}, { locale })}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.channelCount})
                </option>
              ))}
            </select>
          </div>
        </div>

        {groups.length === 0 && (
          <p className="px-1 text-xs text-fg-muted">
            {m.settings_focus_mode_no_groups({}, { locale })}
          </p>
        )}
      </div>

      {/* Decay Transition Timeframe */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-fg-muted" />
              {m.settings_focus_mode_transition_days({}, { locale })}
            </span>
            <span className="text-xs text-fg-soft">
              {m.settings_focus_mode_transition_days_description({}, { locale })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_DAYS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTransitionDays(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  transitionDays === days
                    ? "bg-fg text-app"
                    : "bg-surface-strong text-fg-muted hover:text-fg hover:bg-surface-strong/80"
                }`}
              >
                {days}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cutoff Window */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-fg-muted" />
              {m.settings_focus_mode_hide_old_archive({}, { locale })}
            </span>
            <span className="text-xs text-fg-soft">
              {m.settings_focus_mode_hide_old_archive_description({}, { locale })}
            </span>
          </div>

          <select
            aria-label={m.settings_focus_mode_hide_old_archive({}, { locale })}
            value={hideOldEntertainmentDays}
            onChange={(e) => setHideOldEntertainmentDays(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-surface-strong px-3 text-xs text-fg sm:w-32"
          >
            <option value={3}>3</option>
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>
    </section>
  );
}
