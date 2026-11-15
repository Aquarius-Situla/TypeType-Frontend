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
import { Check, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_PLAYBACK_SPEED_OPTIONS, playbackSpeedLabel } from "../lib/playback-speed";
import { isSourceRendition, qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import { BAR_BUTTON, BAR_MENU_ITEM, BAR_MENU_POPUP } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useDanmakuStore } from "../stores/danmaku-store";
import { useSabrAudioStore } from "../stores/sabr-audio-store";
import type { CaptionStyles } from "../types/user";
import { MenuGroupSubmenu, type MenuOption, MenuSubmenu } from "./videojs-menu-section";

const ON = "on";
const OFF = "off";
const DANMAKU_SPEEDS = ["0.75", "1", "1.25"] as const;
const DANMAKU_SIZES = ["0.8", "1", "1.25"] as const;

const option = (value: string, label: string): MenuOption => ({ value, label, disabled: false });

function useSpeedSection() {
  const rate = usePlayer(selectPlaybackRate);
  if (rate?.playbackRateAvailability !== "available") return null;
  return {
    value: String(rate.playbackRate),
    options: DEFAULT_PLAYBACK_SPEED_OPTIONS.map((speed) =>
      option(String(speed), playbackSpeedLabel(speed)),
    ),
    onChange: (value: string) => rate.setPlaybackRate(Number(value)),
  };
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
      <MenuSubmenu
        label={m.ui_danmaku()}
        value={on ? ON : OFF}
        options={[option(ON, m.ui_danmaku_on()), option(OFF, m.player_off())]}
        onChange={(value) => {
          if ((value === ON) !== on) toggle();
        }}
      />
      {on && (
        <>
          <MenuSubmenu
            label={m.danmaku_speed_label()}
            value={nearest(DANMAKU_SPEEDS, speed)}
            options={[
              option("0.75", m.danmaku_speed_slow()),
              option("1", m.danmaku_speed_normal()),
              option("1.25", m.danmaku_speed_fast()),
            ]}
            onChange={(value) => setSpeed(Number(value))}
          />
          <MenuSubmenu
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

const CAPTION_SIZES = ["50%", "75%", "100%", "150%", "200%"] as const;
const CAPTION_BACKGROUNDS = ["0%", "50%", "75%", "100%"] as const;

type CaptionStyleProps = { styles: CaptionStyles; onChange: (styles: CaptionStyles) => void };

// The caption style picker of the Vidstack menu, reduced to what native cues can show: size, colour and background.
function CaptionStyleSections({ styles, onChange }: CaptionStyleProps) {
  const set = (key: keyof CaptionStyles) => (value: string) =>
    onChange({ ...styles, [key]: value });
  return (
    <>
      <MenuSubmenu
        label={m.player_caption_size()}
        value={styles.fontSize || "100%"}
        options={CAPTION_SIZES.map((size) => option(size, size))}
        onChange={set("fontSize")}
      />
      <MenuSubmenu
        label={m.player_caption_color()}
        value={styles.textColor || "#ffffff"}
        options={[
          option("#ffffff", m.player_color_white()),
          option("#ffff00", m.player_color_yellow()),
          option("#00ffff", m.player_color_cyan()),
          option("#00ff00", m.player_color_green()),
        ]}
        onChange={set("textColor")}
      />
      <MenuSubmenu
        label={m.player_caption_background()}
        value={styles.textBgOpacity || "100%"}
        options={CAPTION_BACKGROUNDS.map((opacity) => option(opacity, opacity))}
        onChange={set("textBgOpacity")}
      />
    </>
  );
}

type Props = {
  danmaku: boolean;
  captionStyles?: CaptionStyles;
  onCaptionStylesChange?: (styles: CaptionStyles) => void;
};

export function VideoJsWatchSettings({ danmaku, captionStyles, onCaptionStylesChange }: Props) {
  const quality = useQualityOptions({
    formatRendition: (rendition) =>
      isSourceRendition(rendition)
        ? m.player_quality_source()
        : `${rendition.height ?? rendition.width}p`,
  });
  const renditions = usePlayer(selectQuality)?.videoRenditionList;
  const speed = useSpeedSection();
  const audio = useAudioSection();
  const captions = useCaptionsOptions();
  const loop = useLoop();
  const hasQuality = quality?.state.availability === "available";
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
        className={`typetype-settings-menu ${BAR_MENU_POPUP} max-h-[min(24rem,70vh)] w-56 overflow-y-auto overscroll-contain`}
      >
        <Menu.Content>
          {hasQuality && quality && (
            <MenuSubmenu
              label={m.player_quality()}
              value={quality.value}
              options={qualityOptionsBestFirst(quality.options, renditions ?? [])}
              onChange={quality.setValue}
            />
          )}
          {speed && <MenuSubmenu label={m.player_speed()} {...speed} />}
          {audio && <MenuSubmenu label={m.player_audio()} {...audio} />}
          {captions && !captions.hidden && captions.options.length > 1 && (
            <MenuSubmenu
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
              <MenuGroupSubmenu label={m.player_caption_styles()}>
                <CaptionStyleSections styles={captionStyles} onChange={onCaptionStylesChange} />
              </MenuGroupSubmenu>
            )}
          <Menu.CheckboxItem
            checked={loop.value === ON}
            onCheckedChange={(checked: boolean) => loop.onChange(checked ? ON : OFF)}
            className={BAR_MENU_ITEM}
          >
            <span>{m.player_loop()}</span>
            <Menu.ItemIndicator checked={loop.value === ON}>
              <Check className="size-4" aria-hidden="true" />
            </Menu.ItemIndicator>
          </Menu.CheckboxItem>
          {danmaku && (
            <MenuGroupSubmenu label={m.ui_danmaku()}>
              <DanmakuSections />
            </MenuGroupSubmenu>
          )}
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
