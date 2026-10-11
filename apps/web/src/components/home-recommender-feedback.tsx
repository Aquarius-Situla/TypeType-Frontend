import { useState } from "react";
import { useRecommenderFeedback } from "../hooks/use-recommender-feedback";
import { m } from "../paraglide/messages.js";
import { PAGE_REFUSAL_REASONS, type PageRefusalReason } from "../types/recommender";

const CHOICE =
  "h-8 rounded-sm border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed";

const REASON_LABEL: Record<PageRefusalReason, () => string> = {
  repetitive: m.home_algo_page_repetitive,
  unrelated: m.home_algo_page_unrelated,
  old: m.home_algo_page_old,
  missing: m.home_algo_page_missing,
};

export function HomeRecommenderFeedback() {
  const { send } = useRecommenderFeedback(false);
  const [verdict, setVerdict] = useState<"good" | "bad" | null>(null);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState<PageRefusalReason | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) return <p className="px-1 text-xs text-fg-soft">{m.home_algo_thanks()}</p>;
  const submit = () => {
    if (!verdict) return;
    send.mutate(
      { kind: "page", verdict, comment, ...(verdict === "bad" && reason ? { reason } : {}) },
      { onSuccess: () => setSent(true) },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border px-1 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-fg-muted">{m.home_algo_question()}</p>
        {(["good", "bad"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={verdict === choice}
            onClick={() => setVerdict(choice)}
            className={`${CHOICE} ${
              verdict === choice
                ? "border-accent text-accent"
                : "border-border-strong text-fg-muted hover:text-fg"
            }`}
          >
            {choice === "good" ? m.algo_feedback_good() : m.algo_feedback_bad()}
          </button>
        ))}
      </div>
      {verdict === "bad" && (
        <div className="algorithm-enter flex flex-wrap items-center gap-2">
          <p className="text-xs text-fg-soft">{m.home_algo_page_why()}</p>
          {PAGE_REFUSAL_REASONS.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={reason === choice}
              onClick={() => setReason(reason === choice ? null : choice)}
              className={`${CHOICE} ${
                reason === choice
                  ? "border-accent text-accent"
                  : "border-border-strong text-fg-muted hover:text-fg"
              }`}
            >
              {REASON_LABEL[choice]()}
            </button>
          ))}
        </div>
      )}
      {verdict && (
        <div className="algorithm-enter flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={comment}
            maxLength={1000}
            onChange={(event) => setComment(event.target.value)}
            placeholder={m.home_algo_comment()}
            aria-label={m.home_algo_comment()}
            className="h-9 min-w-0 flex-1 rounded-sm border border-border-strong bg-app px-3 text-sm text-fg placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={send.isPending}
            className={`${CHOICE} border-border-strong text-fg hover:bg-surface-strong`}
          >
            {m.home_algo_send()}
          </button>
        </div>
      )}
    </div>
  );
}
