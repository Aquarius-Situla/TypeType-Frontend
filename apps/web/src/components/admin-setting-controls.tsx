import { m } from "../paraglide/messages.js";
import type { AccessMode } from "../types/user";
import { ToggleSwitch } from "./toggle-switch";

const ROW = "flex min-h-14 items-center justify-between gap-4 py-3";

type FieldProps = {
  label: string;
  description?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function AdminTextField({ label, description, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="block py-3">
      <span className="text-sm font-medium text-fg">{label}</span>
      {description && <span className="mt-0.5 block text-xs text-fg-soft">{description}</span>}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-border-strong bg-app px-3 text-sm text-fg placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-border-strong"
      />
    </label>
  );
}

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

export function AdminToggleRow({ label, description, checked, disabled, onChange }: ToggleProps) {
  return (
    <div className={ROW}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="mt-0.5 text-xs text-fg-soft">{description}</p>
      </div>
      <ToggleSwitch
        checked={checked}
        disabled={disabled}
        ariaLabel={label}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

type AccessModeProps = {
  value: AccessMode;
  onChange: (value: AccessMode) => void;
};

export function AdminAccessMode({ value, onChange }: AccessModeProps) {
  return (
    <fieldset className="py-3">
      <legend className="text-sm font-medium text-fg">{m.admin_access_mode_label()}</legend>
      <p className="mt-0.5 text-xs text-fg-soft">{m.admin_access_mode_description()}</p>
      <div className="mt-3 grid grid-cols-2 rounded-md border border-border-strong bg-app p-1">
        {(
          [
            ["unrestricted", m.admin_unrestricted_label()],
            ["allow_list", m.admin_parental_label()],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={`min-h-9 rounded px-2 text-xs font-medium transition-colors ${
              value === mode ? "bg-surface-strong text-fg" : "text-fg-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
