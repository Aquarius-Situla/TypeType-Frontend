import { selectTime, selectVolume, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";

type Props = {
  initialVolume: number;
  initialMuted: boolean;
  settingsReady: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onSeekReady?: (seek: (seconds: number) => void) => void;
};

export function VideoJsPlayerBridge({
  initialVolume,
  initialMuted,
  settingsReady,
  onVolumeChange,
  onSeekReady,
}: Props) {
  const store = usePlayer();
  const volume = usePlayer(selectVolume);
  const time = usePlayer(selectTime);
  const restored = useRef(false);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const timeRef = useRef(time);
  timeRef.current = time;

  useEffect(() => {
    if (!settingsReady || restored.current) return;
    const restore = () => {
      const slice = volumeRef.current;
      if (!store.target || !slice) return false;
      slice.setVolume(initialVolume);
      if (initialMuted) slice.setMuted(true);
      restored.current = true;
      return true;
    };
    if (restore()) return;
    const unsubscribe = store.subscribe(() => {
      if (restore()) unsubscribe();
    });
    return unsubscribe;
  }, [store, settingsReady, initialVolume, initialMuted]);

  useEffect(() => {
    if (restored.current && volume) onVolumeChange?.(volume.volume, volume.muted);
  }, [volume?.volume, volume?.muted, volume, onVolumeChange]);

  useEffect(() => {
    onSeekReady?.((seconds) => {
      void timeRef.current?.seek(seconds);
    });
  }, [onSeekReady]);

  return null;
}
