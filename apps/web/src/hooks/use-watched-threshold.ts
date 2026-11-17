import { useSettings } from "./use-settings";

export function useWatchedThreshold(): number {
  return useSettings().settings.watchedThresholdPercent;
}
