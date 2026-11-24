import { type ReactElement, useEffect, useId, useRef } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  channelName: string;
  alreadySubscribed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AddStudyConfirmDialog({
  channelName,
  alreadySubscribed,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    cancelRef.current?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const description = alreadySubscribed
    ? channelName
      ? m.focus_add_study_only_confirm_description_named({ channel: channelName })
      : m.focus_add_study_only_confirm_description()
    : channelName
      ? m.focus_add_study_confirm_description_named({ channel: channelName })
      : m.focus_add_study_confirm_description();

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,90vw)] rounded-lg border border-border-strong bg-surface p-5 text-left text-fg backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-base font-semibold">
        {m.focus_add_study_confirm_title()}
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-border-strong px-4 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-strong"
        >
          {m.portability_cancel()}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-md bg-fg px-4 py-1.5 text-sm font-medium text-app transition-colors hover:bg-fg-strong"
        >
          {m.focus_add_study_confirm_action()}
        </button>
      </div>
    </dialog>
  );
}
