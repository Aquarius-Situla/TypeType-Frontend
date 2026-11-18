import { selectVolume, usePlayer } from "@videojs/react";
import { useCallback, useRef } from "react";
import { volumeAfterWheel } from "../lib/volume-wheel";

// The wheel over the volume control changes the volume, as on the Vidstack player. The listener is not passive so the
// page does not scroll at the same time.
export function useVideoJsWheelVolume(): (element: HTMLElement | null) => void {
  const volume = usePlayer(selectVolume);
  const latest = useRef(volume);
  latest.current = volume;
  const detach = useRef<(() => void) | null>(null);
  return useCallback((element: HTMLElement | null) => {
    detach.current?.();
    detach.current = null;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const slice = latest.current;
      if (!slice || slice.volumeAvailability === "unsupported" || event.deltaY === 0) return;
      const next = volumeAfterWheel(slice.muted ? 0 : slice.volume, event.deltaY);
      event.preventDefault();
      if (slice.muted && next > 0) slice.setMuted(false);
      slice.setVolume(next);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    detach.current = () => element.removeEventListener("wheel", onWheel);
  }, []);
}
