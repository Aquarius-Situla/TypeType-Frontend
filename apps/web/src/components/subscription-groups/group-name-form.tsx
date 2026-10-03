import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { m } from "../../paraglide/messages.js";

type Props = {
  initialName?: string;
  busy: boolean;
  onSave: (name: string) => Promise<boolean>;
  onCancel?: () => void;
};

export function GroupNameForm({
  initialName = "",
  busy,
  onSave,
  onCancel,
}: Props): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (initialName) {
      input.current?.focus();
      input.current?.select();
    }
  }, [initialName]);
  return (
    <form
      className="flex h-9 shrink-0 items-center gap-1"
      onKeyDown={(event) => {
        if (event.key === "Escape" && onCancel && !busy) {
          event.preventDefault();
          onCancel();
        }
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (name.trim() && (await onSave(name.trim()))) setName("");
      }}
    >
      <input
        ref={input}
        aria-label={onCancel ? m.sg_rename_group() : m.sg_new_group()}
        placeholder={m.sg_new_group()}
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={busy}
        className="h-8 min-w-0 flex-1 border border-border bg-app px-2 text-sm text-fg placeholder:text-fg-muted"
      />
      <button
        type="submit"
        disabled={busy || !name.trim() || (Boolean(onCancel) && name.trim() === initialName)}
        aria-label={onCancel ? m.ui_save() : m.ui_create()}
        className="sg-button w-8 shrink-0 px-0"
      >
        <Check size={15} />
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={m.portability_cancel()}
          className="sg-button w-8 shrink-0 px-0"
        >
          <X size={15} />
        </button>
      )}
    </form>
  );
}
