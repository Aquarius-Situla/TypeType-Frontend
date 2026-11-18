import type {
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
  VideoTrackLike,
} from "@videojs/react";
import { type SabrQualityState, useSabrQualityStore } from "../stores/sabr-quality-store";
import { sabrResolutionOptions } from "./sabr-quality-selection";

type TrackHost = MediaVideoTrackCapability & MediaVideoRenditionCapability;

export function mirrorSabrRenditions(host: TrackHost): () => void {
  let track: VideoTrackLike | null = null;
  let itags = "";

  const choose = () => {
    const state = useSabrQualityStore.getState();
    if (!state.streamId) return;
    const list = host.videoRenditions;
    const chosen = list[list.selectedIndex];
    if (chosen?.id) {
      const itag = Number(chosen.id);
      if (state.manuallySelected && state.selectedItag === itag) return;
      state.selectQuality(state.streamId, itag);
      return;
    }
    if (state.manuallySelected && state.automaticItag !== null)
      state.restoreQuality(state.streamId, state.automaticItag);
  };

  const sync = (state: SabrQualityState) => {
    const selected =
      state.options.find((option) => option.itag === state.selectedItag) ?? state.options[0];
    const resolutions =
      state.streamId && selected ? sabrResolutionOptions(state.options, selected) : [];
    const key = resolutions.map((option) => option.itag).join(",");
    if (key !== itags) {
      if (track) host.removeVideoTrack(track);
      track = null;
      itags = key;
      if (resolutions.length > 1) {
        track = host.addVideoTrack("main");
        track.selected = true;
        for (const option of resolutions) {
          const rendition = track.addRendition(
            "",
            option.width,
            option.height,
            option.codecValue,
            option.bitrate,
            option.fps,
          );
          rendition.id = String(option.itag);
        }
      }
    }
    const active = String(state.selectedItag);
    const renditions = [...host.videoRenditions];
    for (const rendition of renditions) rendition.active = rendition.id === active;
    host.videoRenditions.selectedIndex = state.manuallySelected
      ? renditions.findIndex((rendition) => rendition.id === active)
      : -1;
  };

  host.videoRenditions.addEventListener("change", choose);
  sync(useSabrQualityStore.getState());
  const unsubscribe = useSabrQualityStore.subscribe(sync);
  return () => {
    unsubscribe();
    host.videoRenditions.removeEventListener("change", choose);
    if (track) host.removeVideoTrack(track);
    track = null;
    itags = "";
  };
}
