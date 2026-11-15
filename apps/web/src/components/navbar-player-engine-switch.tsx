import { useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";

export function NavbarPlayerEngineSwitch() {
  const { settings, update } = useSettings();
  // Twitch plays in Video.js only, so on its pages the switch shows Video.js, locked.
  const locked = useRouterState({
    select: (state) => state.location.pathname.startsWith("/twitch"),
  });
  const on = locked || settings.playerEngine === "videojs";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-disabled={locked}
      aria-label={locked ? m.shell_videojs_locked_twitch() : m.shell_try_videojs()}
      title={locked ? m.shell_videojs_locked_twitch() : m.settings_player_engine_description()}
      onClick={() => {
        if (!locked) update.mutate({ playerEngine: on ? "vidstack" : "videojs" });
      }}
      className={`hidden h-8 shrink-0 items-center gap-2 rounded-full px-2 text-xs font-medium text-fg-muted transition-colors sm:inline-flex ${locked ? "cursor-not-allowed" : "hover:text-fg"}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${on ? "bg-accent" : "bg-surface-strong ring-1 ring-border-strong"} ${locked ? "opacity-70" : ""}`}
      >
        <span
          className={`inline-block size-3 rounded-full bg-white shadow transition-transform ${on ? "translate-x-3.5" : "translate-x-0.5"}`}
        ></span>
      </span>
      <span className="inline-flex items-center gap-1">
        {locked && <Lock className="size-3" aria-hidden="true" />}
        {m.shell_videojs()}
      </span>
    </button>
  );
}
