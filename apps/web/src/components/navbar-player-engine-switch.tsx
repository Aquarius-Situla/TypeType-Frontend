import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";

export function NavbarPlayerEngineSwitch({ hidden }: { hidden: boolean }) {
  const { settings, update } = useSettings();
  const on = settings.playerEngine === "videojs";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={m.shell_try_videojs()}
      title={m.settings_player_engine_description()}
      onClick={() => update.mutate({ playerEngine: on ? "vidstack" : "videojs" })}
      className={`${hidden ? "hidden" : "hidden sm:inline-flex"} h-8 shrink-0 items-center gap-2 rounded-full px-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-surface-strong ring-1 ring-border-strong"}`}
      >
        <span
          className={`inline-block size-3 rounded-full bg-white shadow transition-transform ${on ? "translate-x-3.5" : "translate-x-0.5"}`}
        />
      </span>
      <span>{m.shell_videojs()}</span>
    </button>
  );
}
