import { useEffect, useRef } from "react";
import {
  clampPlayerVolume,
  matchesPlayerVolume,
  nextVolumeRestoreStep,
  type PlayerVolumeState,
} from "../lib/player-volume-state";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";

type Props = {
  initialVolume: number;
  initialMuted: boolean;
  settingsReady: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
};

type RestoreState = {
  root: Element;
  sourceKey: string;
  target: PlayerVolumeState;
};

export function VolumeRestorer({
  initialVolume,
  initialMuted,
  settingsReady,
  onVolumeChange,
}: Props) {
  const remote = useMediaRemote();
  const player = useMediaPlayer();
  const volume = useMediaState("volume");
  const muted = useMediaState("muted");
  const canPlay = useMediaState("canPlay");
  const currentSrc = useMediaState("currentSrc");
  const sourceKey = currentSrc
    ? `${currentSrc.type}:${typeof currentSrc.src === "string" ? currentSrc.src : ""}`
    : "";
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  volumeRef.current = volume;
  mutedRef.current = muted;
  const onVolumeChangeRef = useRef(onVolumeChange);
  onVolumeChangeRef.current = onVolumeChange;
  const pendingTargetRef = useRef<PlayerVolumeState | null>(null);
  const restoredTargetRef = useRef<RestoreState | null>(null);

  useEffect(() => {
    if (!settingsReady) {
      pendingTargetRef.current = null;
      return;
    }
    const target = { volume: clampPlayerVolume(initialVolume), muted: initialMuted };
    if (!canPlay) {
      pendingTargetRef.current = null;
      restoredTargetRef.current = null;
      return;
    }
    const root = player?.el;
    if (!root?.isConnected) return;
    const restored = restoredTargetRef.current;
    const current = { volume: volumeRef.current, muted: mutedRef.current };
    const step = nextVolumeRestoreStep(
      restored?.root === root && restored.sourceKey === sourceKey,
      current,
      target,
    );
    if (step === "keep") return;
    if (step === "adopt") {
      onVolumeChangeRef.current?.(current.volume, current.muted);
      return;
    }
    if (step === "matched") {
      pendingTargetRef.current = null;
      restoredTargetRef.current = { root, sourceKey, target };
      return;
    }
    restoredTargetRef.current = null;
    pendingTargetRef.current = target;
    try {
      if (target.muted) {
        remote.changeVolume(target.volume);
        remote.mute();
      } else {
        remote.unmute();
        remote.changeVolume(target.volume);
      }
    } catch {
      pendingTargetRef.current = null;
      restoredTargetRef.current = null;
    }
  }, [settingsReady, canPlay, remote, initialVolume, initialMuted, player, sourceKey]);

  useEffect(() => {
    const target = pendingTargetRef.current;
    if (!target || !matchesPlayerVolume({ volume, muted }, target)) return;
    const root = player?.el;
    if (!root?.isConnected) return;
    pendingTargetRef.current = null;
    restoredTargetRef.current = { root, sourceKey, target };
  }, [player, sourceKey, volume, muted]);

  useEffect(() => {
    if (pendingTargetRef.current) return;
    if (!restoredTargetRef.current) return;
    onVolumeChange?.(volume, muted);
  }, [volume, muted, onVolumeChange]);

  return null;
}
