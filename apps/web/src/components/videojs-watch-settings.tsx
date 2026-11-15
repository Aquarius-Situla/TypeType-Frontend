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
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_PLAYBACK_SPEED_OPTIONS, playbackSpeedLabel } from "../lib/playback-speed";
import { isSourceRendition, qualityOptionsBestFirst } from "../lib/video-js-quality-order";
import { BAR_BUTTON, BAR_MENU_POPUP } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useDanmakuStore } from "../stores/danmaku-store";
import { useSabrAudioStore } from "../stores/sabr-audio-store";
import { type MenuOption, MenuSection } from "./videojs-menu-section";

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
      <MenuSection
        label={m.ui_danmaku()}
        value={on ? ON : OFF}
        options={[option(ON, m.ui_danmaku_on()), option(OFF, m.player_off())]}
        onChange={(value) => {
          if ((value === ON) !== on) toggle();
        }}
      />
      {on && (
        <>
          <MenuSection
            label={m.danmaku_speed_label()}
            value={nearest(DANMAKU_SPEEDS, speed)}
            options={[
              option("0.75", m.danmaku_speed_slow()),
              option("1", m.danmaku_speed_normal()),
              option("1.25", m.danmaku_speed_fast()),
            ]}
            onChange={(value) => setSpeed(Number(value))}
          />
          <MenuSection
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

export function VideoJsWatchSettings({ danmaku }: { danmaku: boolean }) {
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
        className={`${BAR_MENU_POPUP} max-h-[min(24rem,70vh)] w-56 overflow-y-auto overscroll-contain`}
      >
        <Menu.Content>
          {hasQuality && quality && (
            <MenuSection
              label={m.player_quality()}
              value={quality.value}
              options={qualityOptionsBestFirst(quality.options, renditions ?? [])}
              onChange={quality.setValue}
            />
          )}
          {speed && <MenuSection label={m.player_speed()} {...speed} />}
          {audio && <MenuSection label={m.player_audio()} {...audio} />}
          {captions && !captions.hidden && captions.options.length > 1 && (
            <MenuSection
              label={m.player_subtitles()}
              value={captions.value}
              options={captions.options}
              onChange={captions.setValue}
            />
          )}
          <MenuSection
            label={m.player_loop()}
            value={loop.value}
            options={[option(ON, m.player_loop()), option(OFF, m.player_off())]}
            onChange={loop.onChange}
          />
          {danmaku && <DanmakuSections />}
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
