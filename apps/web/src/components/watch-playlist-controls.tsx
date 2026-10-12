import { Eye, EyeOff, Shuffle } from "lucide-react";
import { m } from "../paraglide/messages.js";

export type PlaylistShuffleMode = "off" | "once" | "continuous";

type ShuffleProps = {
  shuffle?: string;
  allowContinuous: boolean;
  onShuffleChange?: (mode: PlaylistShuffleMode) => void;
};

type VisibilityProps = {
  hidden: boolean;
  onToggleHidden: () => void;
};

export function WatchPlaylistShuffleControl({
  shuffle,
  allowContinuous,
  onShuffleChange,
}: ShuffleProps) {
  if (!onShuffleChange) return null;
  return (
    <label className="flex min-w-0 items-center gap-1.5 text-fg-muted">
      <Shuffle size={16} aria-hidden="true" />
      <select
        aria-label={m.ui_shuffle_playlist()}
        className="min-w-0 flex-1 rounded border border-border bg-surface px-1 py-1.5 text-xs text-fg"
        value={shuffle?.startsWith("continuous:") ? "continuous" : shuffle ? "once" : "off"}
        onChange={(event) => onShuffleChange(event.target.value as PlaylistShuffleMode)}
      >
        <option value="off">{m.ui_off()}</option>
        <option value="once">{m.ui_shuffle_once()}</option>
        {allowContinuous && <option value="continuous">{m.ui_shuffle_continuous()}</option>}
      </select>
    </label>
  );
}

export function WatchPlaylistVisibilityToggle({ hidden, onToggleHidden }: VisibilityProps) {
  return (
    <button
      type="button"
      aria-label={m.ui_hide_upcoming_playlist_videos()}
      aria-pressed={hidden}
      title={m.ui_hide_upcoming_playlist_videos()}
      onClick={onToggleHidden}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
        hidden ? "bg-fg text-app" : "text-fg-muted hover:bg-surface-strong hover:text-fg"
      }`}
    >
      {hidden ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );
}
