import { Menu, selectQuality, usePlayer, useQualityOptions } from "@videojs/react";
import { Check, Settings } from "lucide-react";
import { qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import {
  BAR_BUTTON,
  BAR_MENU_ITEM,
  BAR_MENU_LABEL,
  BAR_MENU_POPUP,
} from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";

export function VideoJsLiveQualityMenu() {
  const quality = useQualityOptions();
  const renditions = usePlayer(selectQuality)?.videoRenditionList;
  if (quality?.state.availability !== "available") return null;
  const options = qualityOptionsBestFirst(quality.options, renditions ?? []);
  return (
    <Menu.Root side="top" align="end">
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
          <Menu.RadioGroup
            aria-label={m.player_quality()}
            value={quality.value}
            onValueChange={quality.setValue}
          >
            {options.map((option) => (
              <Menu.RadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={BAR_MENU_ITEM}
              >
                <span>{option.label}</span>
                <Menu.ItemIndicator checked={option.value === quality.value}>
                  <Check className="size-4" aria-hidden="true" />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
