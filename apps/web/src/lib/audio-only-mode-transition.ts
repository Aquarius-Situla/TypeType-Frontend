type Args = {
  paramChanged: boolean;
  defaultEnabled: boolean;
  positionMs: number | null;
  fallbackPositionMs: number;
};

type Transition = {
  active: boolean;
  switchPositionMs: number | null;
};

export function resolveAudioOnlyModeTransition({
  paramChanged,
  defaultEnabled,
  positionMs,
  fallbackPositionMs,
}: Args): Transition {
  if (paramChanged) return { active: defaultEnabled, switchPositionMs: null };

  const position =
    positionMs !== null && Number.isFinite(positionMs) ? positionMs : fallbackPositionMs;
  return {
    active: defaultEnabled,
    switchPositionMs: Math.max(0, Number.isFinite(position) ? position : 0),
  };
}
