import { Menu, QualityRadioGroup } from "@videojs/react";
import { Check, Settings } from "lucide-react";
import {
  BAR_BUTTON,
  BAR_MENU_ITEM,
  BAR_MENU_LABEL,
  BAR_MENU_POPUP,
} from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";

export function VideoJsLiveQualityMenu() {
  return (
    <Menu.Root side="top" align="end">
      <QualityRadioGroup.Root label={m.player_quality()}>
        <Menu.Trigger
          aria-label={m.player_quality()}
          title={m.player_quality()}
          className={BAR_BUTTON}
          render={<button type="button" />}
        >
          <Settings className="size-5" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Popup className={BAR_MENU_POPUP}>
          <Menu.Content>
            <p className={BAR_MENU_LABEL}>{m.player_quality()}</p>
            <QualityRadioGroup.Options
              renderItem={(props, item) => (
                <Menu.RadioItem {...props} className={BAR_MENU_ITEM}>
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
  );
}
