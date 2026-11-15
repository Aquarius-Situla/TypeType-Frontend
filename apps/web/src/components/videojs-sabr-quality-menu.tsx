import { Menu, selectControls, usePlayer } from "@videojs/react";
import { Check, Settings2 } from "lucide-react";
import { sabrResolutionOptions } from "../lib/sabr-quality-selection";
import {
  CORNER_MENU_ITEM,
  CORNER_MENU_POPUP,
  CORNER_MENU_TRIGGER,
  CORNER_MENU_WRAPPER,
} from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useSabrQualityStore } from "../stores/sabr-quality-store";

export function VideoJsSabrQualityMenu() {
  const visible = usePlayer(selectControls)?.controlsVisible ?? true;
  const streamId = useSabrQualityStore((state) => state.streamId);
  const options = useSabrQualityStore((state) => state.options);
  const selectedItag = useSabrQualityStore((state) => state.selectedItag);
  const selectQuality = useSabrQualityStore((state) => state.selectQuality);
  const selected = options.find((option) => option.itag === selectedItag) ?? options[0];
  if (!streamId || !selected) return null;
  const resolutions = sabrResolutionOptions(options, selected);
  if (resolutions.length <= 1) return null;
  return (
    <div
      className={`${CORNER_MENU_WRAPPER} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Menu.Root side="bottom" align="end">
        <Menu.Trigger
          aria-label={m.player_quality()}
          className={CORNER_MENU_TRIGGER}
          render={<button type="button" />}
        >
          <Settings2 className="size-4" aria-hidden="true" />
          {selected.label}
        </Menu.Trigger>
        <Menu.Popup className={CORNER_MENU_POPUP}>
          <Menu.Content>
            <Menu.RadioGroup
              aria-label={m.player_quality()}
              value={String(selected.itag)}
              onValueChange={(value) => {
                const itag = Number(value);
                if (Number.isInteger(itag)) selectQuality(streamId, itag);
              }}
            >
              {resolutions.map((option) => (
                <Menu.RadioItem
                  key={option.itag}
                  value={String(option.itag)}
                  className={CORNER_MENU_ITEM}
                >
                  <span>{option.label}</span>
                  <Menu.ItemIndicator checked={option.itag === selected.itag}>
                    <Check className="size-4" aria-hidden="true" />
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Popup>
      </Menu.Root>
    </div>
  );
}
