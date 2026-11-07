import { useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useSettings } from "../hooks/use-settings";
import { deleteSeekbarIcon, uploadSeekbarIcon } from "../lib/api-seekbar-icon";
import { SEEKBAR_ICON_MAX_BYTES, SEEKBAR_ICON_TYPES, seekbarIconSource } from "../lib/seekbar-icon";
import { m } from "../paraglide/messages.js";
import type { SeekbarIcon } from "../types/user";

const OPTIONS: { value: SeekbarIcon; label: () => string }[] = [
  { value: "typetype", label: m.settings_seekbar_icon_typetype },
  { value: "custom", label: m.settings_seekbar_icon_custom },
  { value: "none", label: m.settings_seekbar_icon_none },
];

const optionClass =
  "cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-border-strong transition-colors has-[:checked]:bg-fg has-[:checked]:text-app has-[:checked]:ring-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

export function SettingsSeekbarIcon() {
  const { settings, update } = useSettings();
  const { isAuthed, isGuest } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUpload = isAuthed && !isGuest;
  const hasCustom = settings.seekbarIconUrl.length > 0;
  const source = seekbarIconSource(settings.seekbarIcon, settings.seekbarIconUrl);

  function choose(value: SeekbarIcon) {
    setError(null);
    if (value === "custom" && !hasCustom) {
      fileInput.current?.click();
      return;
    }
    update.mutate({ seekbarIcon: value });
  }

  async function upload(file: File) {
    setError(null);
    if (!SEEKBAR_ICON_TYPES.includes(file.type))
      return setError(m.settings_seekbar_icon_error_format());
    if (file.size > SEEKBAR_ICON_MAX_BYTES) return setError(m.settings_seekbar_icon_error_size());
    setBusy(true);
    try {
      const url = await uploadSeekbarIcon(file);
      update.mutate({ seekbarIcon: "custom", seekbarIconUrl: url });
    } catch {
      setError(m.settings_seekbar_icon_error_upload());
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      await deleteSeekbarIcon();
      update.mutate({ seekbarIcon: "typetype", seekbarIconUrl: "" });
    } catch {
      setError(m.settings_seekbar_icon_error_upload());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border py-4">
      <div className="typetype-adaptive-label flex min-w-0 flex-col gap-1">
        <span className="text-sm text-fg">{m.settings_seekbar_icon_label()}</span>
        <span className="text-xs text-fg-soft">{m.settings_seekbar_icon_description()}</span>
      </div>
      <fieldset className="flex flex-wrap gap-2" disabled={busy}>
        <legend className="sr-only">{m.settings_seekbar_icon_label()}</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className={optionClass}>
            <input
              type="radio"
              name="seekbar-icon"
              value={option.value}
              checked={
                settings.seekbarIcon === option.value && (option.value !== "custom" || hasCustom)
              }
              disabled={option.value === "custom" && !canUpload}
              onChange={() => choose(option.value)}
              className="sr-only"
            />
            {option.label()}
          </label>
        ))}
      </fieldset>
      {canUpload ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            className="rounded-md bg-surface-soft px-3 py-1.5 text-fg hover:bg-surface-strong disabled:opacity-50"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            {hasCustom ? m.settings_seekbar_icon_replace() : m.settings_seekbar_icon_upload()}
          </button>
          {hasCustom && (
            <button
              type="button"
              className="text-fg-soft underline-offset-4 hover:text-fg hover:underline disabled:opacity-50"
              onClick={() => void remove()}
              disabled={busy}
            >
              {m.settings_seekbar_icon_remove()}
            </button>
          )}
          <span className="text-xs text-fg-soft">{m.settings_seekbar_icon_hint()}</span>
          <input
            ref={fileInput}
            type="file"
            accept={SEEKBAR_ICON_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
        </div>
      ) : (
        <span className="text-xs text-fg-soft">{m.settings_seekbar_icon_guest()}</span>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
      <div className="relative flex h-8 items-center" aria-hidden="true">
        <div className="relative h-1.5 flex-1 rounded-full bg-fg/15">
          <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[var(--typetype-player-brand,#ff174d)]" />
        </div>
        {source && (
          <img
            src={source}
            alt=""
            className="pointer-events-none absolute left-2/5 h-7 w-7 -translate-x-1/2 object-contain"
          />
        )}
      </div>
    </div>
  );
}
