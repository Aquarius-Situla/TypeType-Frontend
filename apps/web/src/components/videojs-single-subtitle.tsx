import { useEffect } from "react";

const isSubtitle = (track: TextTrack) => track.kind === "subtitles" || track.kind === "captions";

// When subtitles are turned on before their tracks have loaded, Chromium ends up showing the other tracks of the list
// as they load, so two or three languages draw over each other. Only one stays shown: the one that was shown alone
// last, or the first.
export function VideoJsSingleSubtitle({ video }: { video: HTMLVideoElement | null }) {
  useEffect(() => {
    if (!video) return;
    const tracks = video.textTracks;
    let current: TextTrack | null = null;
    const enforce = () => {
      const shown = Array.from(tracks).filter(
        (track) => isSubtitle(track) && track.mode === "showing",
      );
      if (shown.length === 1) {
        current = shown[0];
        return;
      }
      if (shown.length < 2) return;
      const keep = current && shown.includes(current) ? current : shown[0];
      for (const track of shown) if (track !== keep) track.mode = "disabled";
      current = keep;
    };
    tracks.addEventListener("change", enforce);
    tracks.addEventListener("addtrack", enforce);
    video.addEventListener("load", enforce, true);
    return () => {
      tracks.removeEventListener("change", enforce);
      tracks.removeEventListener("addtrack", enforce);
      video.removeEventListener("load", enforce, true);
    };
  }, [video]);
  return null;
}
