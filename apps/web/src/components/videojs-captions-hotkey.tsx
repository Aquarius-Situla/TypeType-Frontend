import { selectTextTrack, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";
import { useSettings } from "../hooks/use-settings";
import { pickSubtitleTrack } from "../lib/video-js-tracks";
import { isEditableTarget } from "./player-hotkeys-utils";

const baseLanguage = (language: string) => language.toLowerCase().split("-")[0];

// C turns subtitles off when some show, and otherwise on in the preferred language, then the browser language, then
// the first track written by hand. The Video.js toggle action did nothing while no track had been picked yet.
export function VideoJsCaptionsHotkey() {
  const slice = usePlayer(selectTextTrack);
  const preferred = useSettings().settings.defaultSubtitleLanguage;
  const latest = useRef({ slice, preferred });
  latest.current = { slice, preferred };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "c" && event.key !== "C") return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isEditableTarget(event.target)) return;
      const { slice: current, preferred: language } = latest.current;
      const tracks = (current?.textTrackList ?? []).filter(
        (track) => track.kind === "subtitles" || track.kind === "captions",
      );
      if (!current || tracks.length === 0) return;
      if (tracks.some((track) => track.mode === "showing")) {
        current.selectSubtitlesTrack(null);
        return;
      }
      const wanted = language || navigator.language;
      const target =
        pickSubtitleTrack(tracks, true, language || undefined) ??
        tracks.find((track) => baseLanguage(track.language) === baseLanguage(wanted)) ??
        tracks.find((track) => !/auto/i.test(track.label)) ??
        tracks[0];
      current.selectSubtitlesTrack(target.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
