import { useMedia } from "@videojs/react";
import { useEffect, useState } from "react";

// useCaptionsOptions reads the text tracks when its component renders but does not render again when the browser
// adds them, which a parent re-rendering every frame used to hide; this counter changes with the track list instead.
export function useVideoJsTextTrackVersion(): number {
  const media = useMedia() as { textTracks?: TextTrackList } | null;
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const tracks = media?.textTracks;
    if (!tracks) return;
    const bump = () => setVersion((value) => value + 1);
    tracks.addEventListener("addtrack", bump);
    tracks.addEventListener("removetrack", bump);
    tracks.addEventListener("change", bump);
    bump();
    return () => {
      tracks.removeEventListener("addtrack", bump);
      tracks.removeEventListener("removetrack", bump);
      tracks.removeEventListener("change", bump);
    };
  }, [media]);
  return version;
}
