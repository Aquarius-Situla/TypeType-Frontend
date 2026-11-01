import { useInterfaceLocale } from "../hooks/use-interface-locale";
import {
  DefaultMenuCheckbox,
  DefaultMenuItem,
  useMediaRemote,
  useMediaState,
} from "../lib/vidstack";
import { m } from "../paraglide/messages.js";

export function LoopToggle() {
  const { locale } = useInterfaceLocale();
  const remote = useMediaRemote();
  const loop = useMediaState("loop");
  const label = m.player_loop({}, { locale });

  return (
    <div className="vds-loop-menu">
      <DefaultMenuItem label={label}>
        <DefaultMenuCheckbox
          label={label}
          checked={loop}
          defaultChecked={loop}
          onChange={(checked, trigger) => remote.userPrefersLoopChange(checked, trigger)}
        />
      </DefaultMenuItem>
    </div>
  );
}
