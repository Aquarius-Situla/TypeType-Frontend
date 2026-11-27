import { useRouter } from "@tanstack/react-router";
import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { m } from "../paraglide/messages.js";
import { FocusQuestionMascot } from "./focus-question-mascot";

type Props = {
  isRewatch: boolean;
  videoTitle: string;
  submitting: boolean;
  onSubmit: (reason: string) => void;
};

export function FocusAiReviewPanel({
  isRewatch,
  videoTitle,
  submitting,
  onSubmit,
}: Props): ReactElement {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const canSubmit = !submitting && reason.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(reason.trim());
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-app px-4">
      <FocusQuestionMascot className="w-44 shrink-0 sm:w-52" />
      <div className="flex max-w-md flex-col items-center gap-1.5 text-center">
        <p className="text-base font-semibold tracking-tight text-fg">
          {isRewatch ? m.focus_ai_question_rewatch() : m.focus_ai_question_outside()}
        </p>
        {videoTitle && <p className="line-clamp-2 text-xs text-fg-muted">{videoTitle}</p>}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-[min(24rem,90vw)] flex-col items-center gap-3"
      >
        <textarea
          ref={inputRef}
          rows={3}
          value={reason}
          disabled={submitting}
          maxLength={500}
          placeholder={m.focus_ai_reason_placeholder()}
          onChange={(event) => setReason(event.target.value)}
          className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-soft focus:border-fg focus:outline-none disabled:opacity-50"
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => router.history.back()}
            className="cursor-pointer rounded-md bg-surface-strong px-5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-soft disabled:opacity-50"
          >
            {m.not_found_back()}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="cursor-pointer rounded-md bg-fg px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? m.focus_ai_submitting() : m.focus_ai_submit()}
          </button>
        </div>
      </form>
    </div>
  );
}
