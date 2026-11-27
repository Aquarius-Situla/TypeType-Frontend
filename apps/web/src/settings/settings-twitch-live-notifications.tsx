import { useTwitchLiveNotifications } from "../hooks/use-twitch-live-notifications";
import { m } from "../paraglide/messages.js";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

export function SettingsTwitchLiveNotifications() {
  const { linked, query, update } = useTwitchLiveNotifications();
  if (!linked || !query.data) return null;
  const enabled = query.data.enabled;

  return (
    <div className={ROW}>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-fg">{m.settings_notifications_twitch_live_label()}</span>
        <span className="text-xs text-fg-soft">
          {m.settings_notifications_twitch_live_description()}
        </span>
      </div>
      <ToggleSwitch
        checked={enabled}
        ariaLabel={m.settings_notifications_twitch_live_label()}
        disabled={update.isPending}
        onClick={() => update.mutate(!enabled)}
      />
    </div>
  );
}
