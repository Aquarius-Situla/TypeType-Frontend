import { type ReactNode, useState } from "react";
import { useFocus } from "../hooks/use-focus";
import { useSubscriptionGroups } from "../hooks/use-subscription-groups";
import type { FocusSchedule, FocusSettings, FocusSettingsRequest } from "../lib/api-focus";
import { clientTimezone } from "../lib/client-timezone";
import { focusStatus } from "../lib/focus-status";
import { m } from "../paraglide/messages.js";
import { ROW } from "./settings-toggle-switch";

const SECTION_LABEL = "px-1 text-xs font-medium text-fg-soft uppercase tracking-wider";
const SELECT =
  "typetype-adaptive-control h-9 w-full max-w-full rounded-sm border border-border-strong bg-app px-2.5 text-sm text-fg disabled:opacity-50 sm:w-56";
const BUTTON = "h-9 rounded-sm px-4 text-sm font-medium transition-colors disabled:opacity-50";
const PRIMARY = `${BUTTON} bg-accent text-white hover:bg-accent-strong`;
const TRANSITION_DAYS = [30, 60, 90];
const ARCHIVE_DAYS = [3, 7, 14, 30];

type Option = { value: string; label: string };
type Change = Omit<FocusSettingsRequest, "enabled">;

function statusText(settings: FocusSettings): string {
  const status = focusStatus(settings, Date.now());
  if (status.kind === "off") return m.focus_status_off();
  if (status.kind === "leaving") return m.focus_status_leaving({ hours: status.hours });
  return m.focus_status_on({ day: status.day, total: status.total, percent: status.percent });
}

function dayOptions(choices: number[], current: number, label: (days: number) => string): Option[] {
  return [...new Set([...choices, current])].map((days) => ({
    value: String(days),
    label: label(days),
  }));
}

function SelectRow({
  label,
  hint,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  options: Option[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={ROW}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm text-fg">{label}</span>
        {hint && <span className="text-xs text-fg-soft">{hint}</span>}
      </div>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SettingsFocus() {
  const { query, save } = useFocus();
  const groups = useSubscriptionGroups();
  const [failed, setFailed] = useState(false);
  const settings = query.data;
  if (!settings) return null;
  const locked = settings.enabled;
  const groupOptions = (groups.data ?? []).map((group) => ({ value: group.id, label: group.name }));
  const noGroups = groupOptions.length === 0;
  const run = (request: FocusSettingsRequest) => {
    setFailed(false);
    save.mutate(request, { onError: () => setFailed(true) });
  };
  const change = (patch: Change) => run({ enabled: false, ...patch });

  return (
    <section className="flex flex-col gap-3">
      <p className={SECTION_LABEL}>{m.settings_focus_label()}</p>
      <p className="px-1 text-sm text-fg-soft">{m.focus_intro()}</p>
      <div className="divide-y divide-border border-y border-border">
        <SelectRow
          label={m.focus_group()}
          hint={noGroups ? m.focus_no_groups() : undefined}
          value={settings.entertainmentGroupId ?? ""}
          options={[{ value: "", label: m.focus_group_none() }, ...groupOptions]}
          disabled={locked || noGroups}
          onChange={(value) => change({ entertainmentGroupId: value || null })}
        />
        <SelectRow
          label={m.focus_study_group()}
          hint={m.focus_study_hint()}
          value={settings.studyGroupId ?? ""}
          options={[
            { value: "", label: m.focus_study_none() },
            ...groupOptions.filter((option) => option.value !== settings.entertainmentGroupId),
          ]}
          disabled={locked || noGroups}
          onChange={(value) => change({ studyGroupId: value })}
        />
        <SelectRow
          label={m.focus_transition()}
          value={String(settings.transitionDays)}
          options={dayOptions(TRANSITION_DAYS, settings.transitionDays, (days) =>
            m.focus_days({ days }),
          )}
          disabled={locked}
          onChange={(value) => change({ transitionDays: Number(value) })}
        />
        <SelectRow
          label={m.focus_archive()}
          value={String(settings.archiveDays)}
          options={dayOptions(ARCHIVE_DAYS, settings.archiveDays, (days) =>
            m.focus_last_days({ days }),
          )}
          disabled={locked}
          onChange={(value) => change({ archiveDays: Number(value) })}
        />
        <SelectRow
          label={m.focus_schedule()}
          value={settings.schedule}
          options={[
            { value: "always", label: m.focus_schedule_always() },
            { value: "weekdays", label: m.focus_schedule_weekdays() },
          ]}
          disabled={locked}
          onChange={(value) =>
            change({ schedule: value as FocusSchedule, timezone: clientTimezone() })
          }
        />
        <div className={ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{statusText(settings)}</span>
            <span className="text-xs text-fg-soft">
              {locked ? m.focus_locked_note() : m.focus_exit_note()}
            </span>
          </div>
          <FocusAction settings={settings} busy={save.isPending} onRun={run} />
        </div>
      </div>
      {failed && (
        <p role="alert" className="px-1 text-xs text-danger-strong">
          {m.ui_action_failed()}
        </p>
      )}
    </section>
  );
}

function FocusAction({
  settings,
  busy,
  onRun,
}: {
  settings: FocusSettings;
  busy: boolean;
  onRun: (request: FocusSettingsRequest) => void;
}) {
  if (!settings.enabled) {
    return (
      <button
        type="button"
        disabled={busy || !settings.entertainmentGroupId}
        onClick={() => onRun({ enabled: true })}
        className={PRIMARY}
      >
        {m.focus_turn_on()}
      </button>
    );
  }
  if (settings.disableAt !== null) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onRun({ enabled: true })}
        className={PRIMARY}
      >
        {m.focus_keep_on()}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onRun({ enabled: false })}
      className={`${BUTTON} border border-border-strong text-fg hover:bg-surface-strong`}
    >
      {m.focus_turn_off()}
    </button>
  );
}
