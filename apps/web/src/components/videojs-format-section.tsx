import type * as dashjs from "dashjs";
import { useDashPlayerSnapshot } from "../lib/dash-player-store";
import { dashTrackGroups, maxTrackHeight, selectDashTrack } from "../lib/dash-video";
import { type CodecFamily, codecFamily } from "../lib/quality-utils";
import {
  maxSabrCodecLabel,
  sabrCodecOptions,
  selectSabrCodec,
} from "../lib/sabr-quality-selection";
import { useSabrQualityStore } from "../stores/sabr-quality-store";
import type { MenuOption } from "./videojs-menu-section";

const FORMAT_ORDER: CodecFamily[] = ["H.264", "VP9", "AV1"];

type FormatSection = { value: string; options: MenuOption[]; onChange: (value: string) => void };

const isCodecFamily = (value: string): value is CodecFamily =>
  FORMAT_ORDER.includes(value as CodecFamily);
const option = (value: string, label: string): MenuOption => ({ value, label, disabled: false });

function dashLabel(family: CodecFamily, track: dashjs.MediaInfo): string {
  const height = maxTrackHeight(track);
  return height > 0 ? `${family} ${height}p` : family;
}

// The codec choice of the Vidstack player: YouTube through the SABR quality list, BiliBili through dash.js.
export function useFormatSection(): FormatSection | null {
  const { player, selectedVideoTrack } = useDashPlayerSnapshot();
  const streamId = useSabrQualityStore((state) => state.streamId);
  const sabrOptions = useSabrQualityStore((state) => state.options);
  const selectedItag = useSabrQualityStore((state) => state.selectedItag);
  const selectQuality = useSabrQualityStore((state) => state.selectQuality);

  if (streamId && sabrOptions.length > 0) {
    const selected = sabrOptions.find((item) => item.itag === selectedItag) ?? sabrOptions[0];
    const codecs = sabrCodecOptions(sabrOptions);
    if (!selected || codecs.length <= 1) return null;
    return {
      value: selected.codec,
      options: codecs.map((codec) =>
        option(codec, `${codec} ${maxSabrCodecLabel(sabrOptions, codec)}`),
      ),
      onChange: (value) => {
        if (!isCodecFamily(value)) return;
        const next = selectSabrCodec(sabrOptions, selected, value);
        if (next) selectQuality(streamId, next.itag);
      },
    };
  }

  const groups = player ? dashTrackGroups(player) : null;
  if (!player || !groups || groups.size <= 1) return null;
  const current = codecFamily(
    selectedVideoTrack?.codec ?? player.getCurrentTrackFor("video")?.codec ?? null,
  );
  const selected = current ?? FORMAT_ORDER.find((family) => groups.has(family));
  if (!selected) return null;
  return {
    value: selected,
    options: FORMAT_ORDER.flatMap((family) => {
      const track = groups.get(family);
      return track ? [option(family, dashLabel(family, track))] : [];
    }),
    onChange: (value) => {
      const track = isCodecFamily(value) ? groups.get(value) : undefined;
      if (track) selectDashTrack(player, track);
    },
  };
}
