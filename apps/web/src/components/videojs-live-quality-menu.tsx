import { Menu, QualityRadioGroup } from "@videojs/react";
import { Check, Settings2 } from "lucide-react";
import {
  CORNER_MENU_ITEM,
  CORNER_MENU_POPUP,
  CORNER_MENU_TRIGGER,
  CORNER_MENU_WRAPPER,
} from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useVideoJsLivePlayer } from "./videojs-live-player";

export function VideoJsLiveQualityMenu() {
  const visible = useVideoJsLivePlayer((state) => state.controlsVisible);
  return (
    <div
      className={`${CORNER_MENU_WRAPPER} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Menu.Root side="bottom" align="end">
        <QualityRadioGroup.Root label={m.player_quality()}>
          <Menu.Trigger
            aria-label={m.player_quality()}
            className={CORNER_MENU_TRIGGER}
            render={<button type="button" />}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            <QualityRadioGroup.Value />
          </Menu.Trigger>
          <Menu.Popup className={CORNER_MENU_POPUP}>
            <Menu.Content>
              <QualityRadioGroup.Options
                renderItem={(props, item) => (
                  <Menu.RadioItem {...props} className={CORNER_MENU_ITEM}>
                    <span>{item.label}</span>
                    <Menu.ItemIndicator checked={item.checked}>
                      <Check className="size-4" aria-hidden="true" />
                    </Menu.ItemIndicator>
                  </Menu.RadioItem>
                )}
              />
            </Menu.Content>
          </Menu.Popup>
        </QualityRadioGroup.Root>
      </Menu.Root>
    </div>
  );
}
