import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { formatCooldownMinutes, isAllowOnceExhausted } from "../lib/focus-allow-once";
import { m } from "../paraglide/messages.js";

type Props = {
  challengeText: string;
  remainingToday: number;
  cooldownMs?: number;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (code: string) => void;
  onCancel: () => void;
};

export function FocusAllowOnceForm({
  challengeText,
  remainingToday,
  cooldownMs = 0,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: Props): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const exhausted = isAllowOnceExhausted(remainingToday);
  const canSubmit = !exhausted && !submitting && code.trim().length > 0;
  const cooldownMinutes = formatCooldownMinutes(cooldownMs);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(code.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
      <div
        onCopy={(event) => event.preventDefault()}
        onCut={(event) => event.preventDefault()}
        className="select-none break-all rounded-md border border-border-strong bg-app px-3.5 py-2.5 text-center font-mono text-sm font-medium leading-relaxed tracking-wider text-fg"
      >
        {challengeText}
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-fg-muted">
        <span>{m.focus_allow_once_input_label()}</span>
        <input
          ref={inputRef}
          type="text"
          value={code}
          disabled={exhausted || submitting}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={m.focus_allow_once_input_placeholder()}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onChange={(event) => setCode(event.target.value)}
          className="h-9 rounded-md border border-border-strong bg-app px-3 font-mono text-sm tracking-wider text-fg placeholder:font-sans placeholder:tracking-normal placeholder:text-fg-soft focus:border-fg focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
      {errorMessage && (
        <p role="alert" className="text-xs text-danger-strong">
          {errorMessage}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-border-strong px-4 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-strong"
        >
          {m.portability_cancel()}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            exhausted
              ? "cursor-not-allowed bg-surface-strong text-fg-soft opacity-60"
              : "cursor-pointer bg-fg text-app hover:bg-fg-strong disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          {submitting ? m.ui_saving() : m.focus_allow_once_confirm()}
        </button>
      </div>
      {cooldownMinutes > 0 && (
        <p className="text-xs leading-relaxed text-fg-muted">
          {m.focus_allow_once_cooldown_notice({ minutes: cooldownMinutes })}
        </p>
      )}
      <p className="text-xs text-fg-soft">
        {m.focus_allow_once_remaining({ count: remainingToday })}
      </p>
    </form>
  );
}
