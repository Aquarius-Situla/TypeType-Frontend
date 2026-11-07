import { useEffect, useRef } from "react";
import { requestSabrSeek, requestSabrVidstackPlayback } from "../lib/sabr-vidstack-bridge";
import { useMediaRemote, useMediaState } from "../lib/vidstack";
import { MediaSessionPositionSync } from "./media-session-position-sync";

type Props = {
  title?: string;
  artist?: string;
  artwork?: string;
  canSeek?: boolean;
  isLive?: boolean;
  seeking?: boolean;
  sabrVideo?: HTMLVideoElement | null;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
};

function safeSetActionHandler(
  session: MediaSession,
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  try {
    session.setActionHandler(action, handler);
  } catch {}
}

export function MediaSessionSync({
  title,
  artist,
  artwork,
  canSeek = true,
  isLive = false,
  seeking = false,
  sabrVideo = null,
  onPreviousTrack,
  onNextTrack,
}: Props) {
  const remote = useMediaRemote();
  const paused = useMediaState("paused");
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (typeof MediaMetadata === "undefined") return;
    const safeTitle = title?.trim();
    if (!safeTitle) return;
    const safeArtist = artist?.trim();
    const safeArtwork = artwork?.trim();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: safeTitle,
      artist: safeArtist,
      artwork: safeArtwork
        ? [{ src: safeArtwork, sizes: "512x512", type: "image/png" }]
        : undefined,
    });
  }, [title, artist, artwork]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const setPlayback = (playing: boolean) => {
      const request = sabrVideo
        ? requestSabrVidstackPlayback(sabrVideo, playing, true)
        : Promise.resolve(playing ? remote.play() : remote.pause());
      void request.catch(() => {});
    };
    safeSetActionHandler(session, "play", () => {
      setPlayback(true);
    });
    safeSetActionHandler(session, "pause", () => {
      setPlayback(false);
    });
    if (canSeek) {
      const seekTo = (targetSeconds: number) => {
        currentTimeRef.current = targetSeconds;
        if (sabrVideo && requestSabrSeek(sabrVideo, targetSeconds)) return;
        remote.seek(targetSeconds);
      };
      safeSetActionHandler(session, "seekbackward", (details) => {
        const step = details.seekOffset ?? 10;
        const target = Math.max(0, currentTimeRef.current - step);
        seekTo(target);
      });
      safeSetActionHandler(session, "seekforward", (details) => {
        const step = details.seekOffset ?? 10;
        const max = durationRef.current > 0 ? durationRef.current : Number.POSITIVE_INFINITY;
        const target = Math.min(max, currentTimeRef.current + step);
        seekTo(target);
      });
      safeSetActionHandler(session, "seekto", (details) => {
        const next = details.seekTime;
        if (typeof next !== "number" || Number.isNaN(next)) return;
        seekTo(next);
      });
    }
    safeSetActionHandler(session, "stop", () => {
      setPlayback(false);
    });
    safeSetActionHandler(session, "previoustrack", isLive ? null : (onPreviousTrack ?? null));
    safeSetActionHandler(session, "nexttrack", isLive ? null : (onNextTrack ?? null));
    return () => {
      safeSetActionHandler(session, "play", null);
      safeSetActionHandler(session, "pause", null);
      safeSetActionHandler(session, "seekbackward", null);
      safeSetActionHandler(session, "seekforward", null);
      safeSetActionHandler(session, "seekto", null);
      safeSetActionHandler(session, "stop", null);
      safeSetActionHandler(session, "previoustrack", null);
      safeSetActionHandler(session, "nexttrack", null);
    };
  }, [canSeek, isLive, onPreviousTrack, onNextTrack, remote, sabrVideo]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = paused && !seeking ? "paused" : "playing";
  }, [paused, seeking]);

  return <MediaSessionPositionSync currentTimeRef={currentTimeRef} durationRef={durationRef} />;
}
