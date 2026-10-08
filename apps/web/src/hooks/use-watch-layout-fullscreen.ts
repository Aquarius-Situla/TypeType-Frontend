import { useEffect } from "react";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

export function useWatchLayoutFullscreenCleanup() {
  useEffect(
    () => () => {
      useWatchLayoutStore.getState().setWebFullscreen(false);
    },
    [],
  );
}
