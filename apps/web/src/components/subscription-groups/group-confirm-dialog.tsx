import { useEffect, useId, useRef } from "react";
import { m } from "../../paraglide/messages.js";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function GroupConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,90vw)] border border-border-strong bg-surface p-5 text-fg backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-base font-semibold">
        {title}
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button ref={cancel} type="button" onClick={onCancel} className="sg-button">
          {m.portability_cancel()}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="sg-button border-danger text-danger hover:bg-danger/10"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
