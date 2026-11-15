import {
  Menu,
  selectQuality,
  usePlaybackRateOptions,
  usePlayer,
  useQualityOptions,
} from "@videojs/react";
import { Check, Settings } from "lucide-react";
import { qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import {
  BAR_BUTTON,
  BAR_MENU_ITEM,
  BAR_MENU_LABEL,
  BAR_MENU_POPUP,
} from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";

type Option = { value: string; label: string; disabled: boolean };

type SectionProps = {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
};

function Section({ label, value, options, onChange }: SectionProps) {
  return (
    <>
      <p className={BAR_MENU_LABEL}>{label}</p>
      <Menu.RadioGroup aria-label={label} value={value} onValueChange={onChange}>
        {options.map((option) => (
          <Menu.RadioItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={BAR_MENU_ITEM}
          >
            <span>{option.label}</span>
            <Menu.ItemIndicator checked={option.value === value}>
              <Check className="size-4" aria-hidden="true" />
            </Menu.ItemIndicator>
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </>
  );
}

export function VideoJsSettingsMenu({ speed }: { speed: boolean }) {
  const quality = useQualityOptions();
  const renditions = usePlayer(selectQuality)?.videoRenditionList;
  const rate = usePlaybackRateOptions();
  const hasQuality = quality?.state.availability === "available";
  const hasSpeed = speed && rate?.state.availability === "available";
  if (!hasQuality && !hasSpeed) return null;
  return (
    <Menu.Root side="top" align="end">
      <Menu.Trigger
        aria-label={m.player_settings()}
        title={m.player_settings()}
        className={BAR_BUTTON}
        render={<button type="button" />}
      >
        <Settings className="size-5" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Popup className={`${BAR_MENU_POPUP} max-h-72 overflow-y-auto`}>
        <Menu.Content>
          {hasQuality && quality && (
            <Section
              label={m.player_quality()}
              value={quality.value}
              options={qualityOptionsBestFirst(quality.options, renditions ?? [])}
              onChange={quality.setValue}
            />
          )}
          {hasSpeed && rate && (
            <Section
              label={m.player_speed()}
              value={rate.value}
              options={rate.options}
              onChange={rate.setValue}
            />
          )}
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
