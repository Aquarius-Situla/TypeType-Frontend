import { useCallback } from "react";

type LatestHandlers = () => {
  onSeekStateChange: (seeking: boolean) => void;
  onModeSwitchChange?: ((switching: boolean) => void) | undefined;
};

type ErrorReporter = (error: unknown, positionMs?: number) => void;

export function useSabrEngineHandlers(
  latestHandlers: LatestHandlers,
  reportError: ErrorReporter,
): {
  latestEngineHandlers: () => {
    onError: ErrorReporter;
    onSeekStateChange: (seeking: boolean) => void;
    onModeSwitchChange: (switching: boolean) => void;
  };
  setQualityTransitioning: (transitioning: boolean) => void;
} {
  const latestEngineHandlers = useCallback(
    () => ({
      onError: reportError,
      onSeekStateChange: latestHandlers().onSeekStateChange,
      onModeSwitchChange: latestHandlers().onModeSwitchChange ?? (() => undefined),
    }),
    [latestHandlers, reportError],
  );
  const setQualityTransitioning = useCallback(
    (transitioning: boolean) => latestHandlers().onSeekStateChange(transitioning),
    [latestHandlers],
  );
  return { latestEngineHandlers, setQualityTransitioning };
}
