import { useEffect } from "react";
import { applySeekbarIcon, seekbarIconSource } from "../lib/seekbar-icon";
import { useSettings } from "./use-settings";

export function useSeekbarIcon(): string | null {
  const { settings } = useSettings();
  const source = seekbarIconSource(settings.seekbarIcon, settings.seekbarIconUrl);
  useEffect(() => applySeekbarIcon(source), [source]);
  return source;
}
