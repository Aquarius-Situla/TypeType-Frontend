import {
  Menu,
  selectPlaybackRate,
  selectQuality,
  useAudioTrackOptions,
  useCaptionsOptions,
  useMedia,
  usePlayer,
  useQualityOptions,
} from "@videojs/react";
import {
  AudioLines,
  Captions,
  Film,
  Gauge,
  MessageSquareText,
  Repeat,
  Settings,
  SlidersHorizontal,
  Type,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useVideoJsTextTrackVersion } from "../hooks/use-videojs-text-track-version";
import { canBoost } from "../lib/audio-boost";
import { isSourceRendition, qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import { BAR_BUTTON, BAR_MENU_ITEM, BAR_MENU_POPUP } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useDanmakuStore } from "../stores/danmaku-store";
import { useSabrAudioStore } from "../stores/sabr-audio-store";
import type { CaptionStyles } from "../types/user";
import { VideoJsAccessibilitySubmenu } from "./videojs-accessibility-submenu";
import { useBoostTarget, VideoJsBoostPanel } from "./videojs-boost-panel";
import { VideoJsCaptionStylePanel } from "./videojs-caption-style-panel";
import { useFormatSection } from "./videojs-format-section";
import {
  MenuGroupSubmenu,
  type MenuOption,
  MenuRadioSection,
  MenuSubmenu,
  MenuSwitch,
  RowLabel,
} from "./videojs-menu-section";
import { VideoJsSpeedPanel } from "./videojs-speed-panel";

const ON = "on";
const OFF = "off";
const DANMAKU_SPEEDS = ["0.75", "1", "1.25"] as const;
const DANMAKU_SIZES = ["0.8", "1", "1.25"] as const;

const option = (value: string, label: string): MenuOption => ({ value, label, disabled: false });

function useSpeedValue(): string | null {
  const rate = usePlayer(selectPlaybackRate);
  if (rate?.playbackRateAvailability !== "available") return null;
  return String(rate.playbackRate);
}

// YouTube audio languages come from the SABR stream, which Video.js does not see as audio tracks.
function useAudioSection() {
  const native = useAudioTrackOptions();
  const streamId = useSabrAudioStore((state) => state.streamId);
  const sabrOptions = useSabrAudioStore((state) => state.options);
  const selected = useSabrAudioStore((state) => state.selectedTrackId);
  const selectTrack = useSabrAudioStore((state) => state.selectTrack);
  if (streamId && sabrOptions.length > 1) {
    return {
      value: selected ?? "",
      options: sabrOptions.map((track) => option(track.id, track.label)),
      onChange: (value: string) => selectTrack(streamId, value),
    };
  }
  if (!native || native.hidden || native.options.length < 2) return null;
  return { value: native.value, options: native.options, onChange: native.setValue };
}

function useLoop() {
  const media = useMedia() as { loop?: boolean } | null;
  const [loop, setLoop] = useState(false);
  useEffect(() => setLoop(Boolean(media?.loop)), [media]);
  return {
    value: loop ? ON : OFF,
    onChange: (value: string) => {
      if (!media) return;
      media.loop = value === ON;
      setLoop(value === ON);
    },
  };
}

function DanmakuSections() {
  const { on, speed, size, toggle, setSpeed, setSize } = useDanmakuStore();
  const nearest = (values: readonly string[], target: number) =>
    values.reduce((best, value) =>
      Math.abs(Number(value) - target) < Math.abs(Number(best) - target) ? value : best,
    );
  return (
    <>
      <Menu.CheckboxItem
        checked={on}
        onCheckedChange={(checked: boolean) => {
          if (checked !== on) toggle();
        }}
        className={`${BAR_MENU_ITEM} min-h-12`}
      >
        <RowLabel icon={MessageSquareText} label={m.ui_danmaku_on()} />
        <MenuSwitch on={on} />
      </Menu.CheckboxItem>
      {on && (
        <>
          <MenuRadioSection
            label={m.danmaku_speed_label()}
            value={nearest(DANMAKU_SPEEDS, speed)}
            options={[
              option("0.75", m.danmaku_speed_slow()),
              option("1", m.danmaku_speed_normal()),
              option("1.25", m.danmaku_speed_fast()),
            ]}
            onChange={(value) => setSpeed(Number(value))}
          />
          <MenuRadioSection
            label={m.danmaku_size_label()}
            value={nearest(DANMAKU_SIZES, size)}
            options={[
              option("0.8", m.danmaku_size_small()),
              option("1", m.danmaku_size_normal()),
              option("1.25", m.danmaku_size_large()),
            ]}
            onChange={(value) => setSize(Number(value))}
          />
        </>
      )}
    </>
  );
}

type Props = {
  danmaku: boolean;
  captionStyles?: CaptionStyles;
  onCaptionStylesChange?: (styles: CaptionStyles) => void;
};

// The rows follow the player store, which changes on every frame while playing; keeping them in their own component
// stops the popup from re-rendering, because each popup render re-measures its anchor and forces a page layout.
export function VideoJsWatchSettings(props: Props) {
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
          <WatchSettingsRows {...props} />
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}

function WatchSettingsRows({ danmaku, captionStyles, onCaptionStylesChange }: Props) {
  const quality = useQualityOptions({
    formatRendition: (rendition) =>
      isSourceRendition(rendition)
        ? m.player_quality_source()
        : `${rendition.height ?? rendition.width}p`,
  });
  const renditions = usePlayer(selectQuality)?.videoRenditionList;
  const format = useFormatSection();
  const speed = useSpeedValue();
  const audio = useAudioSection();
  useVideoJsTextTrackVersion();
  const captions = useCaptionsOptions();
  const boostTarget = useBoostTarget();
  const loop = useLoop();
  const hasQuality = quality?.state.availability === "available";
  return (
    <>
      {hasQuality && quality && (
        <MenuSubmenu
          icon={SlidersHorizontal}
          label={m.player_quality()}
          value={quality.value}
          options={qualityOptionsBestFirst(quality.options, renditions ?? [])}
          onChange={quality.setValue}
        />
      )}
      {format && <MenuSubmenu icon={Film} label={m.player_format()} {...format} />}
      {speed && (
        <MenuGroupSubmenu
          icon={Gauge}
          label={m.player_speed()}
          hint={speed === "1" ? m.player_normal() : `${speed}x`}
        >
          <VideoJsSpeedPanel />
        </MenuGroupSubmenu>
      )}
      {audio && <MenuSubmenu icon={AudioLines} label={m.player_audio()} {...audio} />}
      {captions && !captions.hidden && captions.options.length > 1 && (
        <MenuSubmenu
          icon={Captions}
          label={m.player_subtitles()}
          value={captions.value}
          options={captions.options}
          onChange={captions.setValue}
        />
      )}
      {captions &&
        !captions.hidden &&
        captions.options.length > 1 &&
        captionStyles &&
        onCaptionStylesChange && (
          <MenuGroupSubmenu icon={Type} label={m.player_caption_styles()}>
            <VideoJsCaptionStylePanel styles={captionStyles} onChange={onCaptionStylesChange} />
          </MenuGroupSubmenu>
        )}
      {boostTarget && canBoost(boostTarget) && (
        <MenuGroupSubmenu icon={Volume2} label={m.player_boost()}>
          <VideoJsBoostPanel video={boostTarget} />
        </MenuGroupSubmenu>
      )}
      <VideoJsAccessibilitySubmenu />
      <Menu.CheckboxItem
        checked={loop.value === ON}
        onCheckedChange={(checked: boolean) => loop.onChange(checked ? ON : OFF)}
        className={`${BAR_MENU_ITEM} min-h-12`}
      >
        <RowLabel icon={Repeat} label={m.player_loop()} />
        <MenuSwitch on={loop.value === ON} />
      </Menu.CheckboxItem>
      {danmaku && (
        <MenuGroupSubmenu icon={MessageSquareText} label={m.ui_danmaku()}>
          <DanmakuSections />
        </MenuGroupSubmenu>
      )}
    </>
  );
}
