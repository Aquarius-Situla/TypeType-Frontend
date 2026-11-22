import { type ReactElement, useEffect, useId, useRef } from "react";
import type { FocusAllowOnceChallengeResponse } from "../lib/api-focus";
import { m } from "../paraglide/messages.js";
import { FocusAllowOnceForm } from "./focus-allow-once-form";

type Props = {
  challenge: FocusAllowOnceChallengeResponse;
  remainingToday: number;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (code: string) => void;
  onCancel: () => void;
};

export function FocusAllowOnceDialog({
  challenge,
  remainingToday,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: Props): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const element = dialog.current;
    element?.showModal();
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
      className="m-auto w-[min(28rem,92vw)] rounded-lg border border-border-strong bg-surface p-5 text-left text-fg backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-base font-semibold">
        {m.focus_allow_once_title()}
      </h2>
      <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        {m.focus_allow_once_description()}
      </p>
      <FocusAllowOnceForm
        key={challenge.challengeId}
        challengeText={challenge.challengeText}
        remainingToday={remainingToday}
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </dialog>
  );
}
