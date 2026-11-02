import type { TypeTypeMsePlayer } from "@typetype/mse";
import { type RefObject, useEffect, useRef } from "react";
import { recordClientEvent } from "../lib/client-debug-log";
import { isAbortError } from "../lib/sabr-playback-retry";

type ModeSwitchHandlers = {
  onError: (error: unknown) => void;
  onSeekStateChange: (seeking: boolean) => void;
  onModeSwitchChange: (switching: boolean) => void;
};

export function useSabrModeSwitch(
  audioOnly: boolean,
  engineRef: RefObject<TypeTypeMsePlayer | null>,
  seekingRef: RefObject<boolean>,
  handlers: () => ModeSwitchHandlers,
): void {
  const appliedRef = useRef(audioOnly);
  const revisionRef = useRef(0);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      appliedRef.current = audioOnly;
      return;
    }
    if (appliedRef.current === audioOnly) return;
    const revision = ++revisionRef.current;
    seekingRef.current = true;
    handlers().onModeSwitchChange(true);
    const stopFollowingSwap = engine.on("state", (event) => {
      if (event.type === "state" && revision === revisionRef.current) {
        handlers().onSeekStateChange(event.state === "seeking");
      }
    });
    void engine
      .setAudioOnly(audioOnly)
      .then(() => {
        if (revision === revisionRef.current) appliedRef.current = audioOnly;
      })
      .catch((error: unknown) => {
        if (revision !== revisionRef.current || isAbortError(error)) return;
        recordClientEvent("player.sabr_mode_switch_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        handlers().onError(error);
      })
      .finally(() => {
        stopFollowingSwap();
        if (revision !== revisionRef.current) return;
        seekingRef.current = false;
        handlers().onSeekStateChange(false);
        handlers().onModeSwitchChange(false);
      });
  }, [audioOnly, engineRef, handlers, seekingRef]);
}
