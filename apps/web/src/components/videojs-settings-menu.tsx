import {
  Menu,
  selectQuality,
  usePlaybackRateOptions,
  usePlayer,
  useQualityOptions,
} from "@videojs/react";
import { Gauge, Settings, SlidersHorizontal, Zap } from "lucide-react";
import { isSourceRendition, qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import { BAR_BUTTON, BAR_MENU_ITEM, BAR_MENU_POPUP } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useLiveLatencyStore } from "../stores/live-latency-store";
import { VideoJsAccessibilitySubmenu } from "./videojs-accessibility-submenu";
import { MenuSubmenu, MenuSwitch, RowLabel } from "./videojs-menu-section";

export function VideoJsSettingsMenu({
  speed,
  latency = false,
}: {
  speed: boolean;
  latency?: boolean;
}) {
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
  const { lowLatency, setLowLatency } = useLiveLatencyStore();
  if (!hasQuality && !hasSpeed && !latency) return null;
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
      <Menu.Popup keepMounted className={`typetype-settings-menu ${BAR_MENU_POPUP}`}>
        <Menu.Content className="typetype-menu-content">
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
          {latency && (
            <Menu.CheckboxItem
              checked={lowLatency}
              onCheckedChange={(checked: boolean) => setLowLatency(checked)}
              className={`${BAR_MENU_ITEM} min-h-12`}
            >
              <RowLabel icon={Zap} label={m.player_low_latency()} />
              <MenuSwitch on={lowLatency} />
            </Menu.CheckboxItem>
          )}
          <VideoJsAccessibilitySubmenu />
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
