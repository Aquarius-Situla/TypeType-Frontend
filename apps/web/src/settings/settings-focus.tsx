import { useState } from "react";
import { useFocus } from "../hooks/use-focus";
import { useSubscriptionGroups } from "../hooks/use-subscription-groups";
import type { FocusSettings } from "../lib/api-focus";
import { focusStatus } from "../lib/focus-status";
import { m } from "../paraglide/messages.js";
import { ROW } from "./settings-toggle-switch";

const SECTION_LABEL = "px-1 text-xs font-medium text-fg-soft uppercase tracking-wider";
const SELECT =
  "typetype-adaptive-control h-9 w-full max-w-full rounded-sm border border-border-strong bg-app px-2.5 text-sm text-fg disabled:opacity-50 sm:w-56";
const BUTTON = "h-9 rounded-sm px-4 text-sm font-medium transition-colors disabled:opacity-50";
const TRANSITION_DAYS = [30, 60, 90];
const ARCHIVE_DAYS = [3, 7, 14, 30];

function statusText(settings: FocusSettings): string {
  const status = focusStatus(settings, Date.now());
  if (status.kind === "off") return m.focus_status_off();
  if (status.kind === "leaving") return m.focus_status_leaving({ hours: status.hours });
  return m.focus_status_on({ day: status.day, total: status.total, percent: status.percent });
}

export function SettingsFocus() {
  const { query, save } = useFocus();
  const groups = useSubscriptionGroups();
  const [failed, setFailed] = useState(false);
  const settings = query.data;
  if (!settings) return null;
  const locked = settings.enabled;
  const groupList = groups.data ?? [];
  const groupId = settings.entertainmentGroupId ?? "";
  const run = (request: Parameters<typeof save.mutate>[0]) => {
    setFailed(false);
    save.mutate(request, { onError: () => setFailed(true) });
  };
  const update = (patch: Omit<Parameters<typeof save.mutate>[0], "enabled">) =>
    run({ enabled: false, ...patch });

  return (
    <section className="flex flex-col gap-3">
      <p className={SECTION_LABEL}>{m.settings_focus_label()}</p>
      <p className="px-1 text-sm text-fg-soft">{m.focus_intro()}</p>
      <div className="divide-y divide-border border-y border-border">
        <div className={ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{m.focus_group()}</span>
            {groupList.length === 0 && (
              <span className="text-xs text-fg-soft">{m.focus_no_groups()}</span>
            )}
          </div>
          <select
            aria-label={m.focus_group()}
            value={groupId}
            disabled={locked || groupList.length === 0}
            onChange={(event) => update({ entertainmentGroupId: event.target.value || null })}
            className={SELECT}
          >
            <option value="">{m.focus_group_none()}</option>
            {groupList.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className={ROW}>
          <span className="typetype-adaptive-label min-w-0 flex-1 text-sm text-fg">
            {m.focus_transition()}
          </span>
          <select
            aria-label={m.focus_transition()}
            value={settings.transitionDays}
            disabled={locked}
            onChange={(event) => update({ transitionDays: Number(event.target.value) })}
            className={SELECT}
          >
            {[...new Set([...TRANSITION_DAYS, settings.transitionDays])].map((days) => (
              <option key={days} value={days}>
                {m.focus_days({ days })}
              </option>
            ))}
          </select>
        </div>
        <div className={ROW}>
          <span className="typetype-adaptive-label min-w-0 flex-1 text-sm text-fg">
            {m.focus_archive()}
          </span>
          <select
            aria-label={m.focus_archive()}
            value={settings.archiveDays}
            disabled={locked}
            onChange={(event) => update({ archiveDays: Number(event.target.value) })}
            className={SELECT}
          >
            {[...new Set([...ARCHIVE_DAYS, settings.archiveDays])].map((days) => (
              <option key={days} value={days}>
                {m.focus_last_days({ days })}
              </option>
            ))}
          </select>
        </div>
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
  onRun: (request: { enabled: boolean }) => void;
}) {
  if (!settings.enabled) {
    return (
      <button
        type="button"
        disabled={busy || !settings.entertainmentGroupId}
        onClick={() => onRun({ enabled: true })}
        className={`${BUTTON} bg-accent text-white hover:bg-accent-strong`}
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
        className={`${BUTTON} bg-accent text-white hover:bg-accent-strong`}
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
