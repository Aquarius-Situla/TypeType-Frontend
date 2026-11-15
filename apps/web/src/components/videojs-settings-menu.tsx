import {
  Menu,
  selectQuality,
  usePlaybackRateOptions,
  usePlayer,
  useQualityOptions,
} from "@videojs/react";
import { Gauge, Settings, SlidersHorizontal } from "lucide-react";
import { isSourceRendition, qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import { BAR_BUTTON, BAR_MENU_POPUP } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { MenuSubmenu } from "./videojs-menu-section";

export function VideoJsSettingsMenu({ speed }: { speed: boolean }) {
  const quality = useQualityOptions({
    formatRendition: (rendition) =>
      isSourceRendition(rendition)
        ? m.player_quality_source()
        : `${rendition.height ?? rendition.width}p`,
  });
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
      <Menu.Popup
        keepMounted
        className={`typetype-settings-menu ${BAR_MENU_POPUP} max-h-72 w-64 overflow-y-auto`}
      >
        <Menu.Content>
          {hasQuality && quality && (
            <MenuSubmenu
              icon={SlidersHorizontal}
              label={m.player_quality()}
              value={quality.value}
              options={qualityOptionsBestFirst(quality.options, renditions ?? [])}
              onChange={quality.setValue}
            />
          )}
          {hasSpeed && rate && (
            <MenuSubmenu
              icon={Gauge}
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
