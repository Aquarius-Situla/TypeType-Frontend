import { type RefObject, useCallback, useRef } from "react";

type SaveVolume = (volume: number, muted: boolean) => void;

// A mute forced because the browser refused sound is not the viewer's choice and must never reach their settings.
export function usePolicyMutedSave(save: SaveVolume | undefined): {
  policyMuted: RefObject<boolean>;
  saveVolume: SaveVolume;
} {
  const policyMuted = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;
  const saveVolume = useCallback((volume: number, muted: boolean) => {
    if (policyMuted.current && muted) return;
    saveRef.current?.(volume, muted);
  }, []);
  return { policyMuted, saveVolume };
}
