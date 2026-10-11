import { useHideInterest } from "../hooks/use-recommender";
import { useRecommenderFeedback } from "../hooks/use-recommender-feedback";
import { m } from "../paraglide/messages.js";
import { type Refusal, useRefusedVideosStore } from "../stores/refused-videos-store";
import { VIDEO_REFUSAL_REASONS, type VideoRefusalReason } from "../types/recommender";

const CHIP =
  "h-7 rounded-sm border border-border-strong px-2.5 text-xs text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed";

const REASON_LABEL: Record<VideoRefusalReason, () => string> = {
  seen: m.home_algo_reason_seen,
  channel: m.home_algo_reason_channel,
  topic: m.home_algo_reason_topic,
  other: m.home_algo_reason_other,
};

type Props = {
  url: string;
  refusal: Refusal;
  subject?: { id: string; title: string };
};

export function HomeRefusedCard({ url, refusal, subject }: Props) {
  const { send, remove } = useRecommenderFeedback(false);
  const refuse = useRefusedVideosStore((state) => state.refuse);
  const restore = useRefusedVideosStore((state) => state.restore);

  const hide = useHideInterest();
  const explain = (reason: VideoRefusalReason) => {
    refuse(url, { ...refusal, explained: true, notThisSubject: reason === "topic" });
    send.mutate({ kind: "video", verdict: "not_for_me", videoUrl: url, reason });
  };
  const undo = () => {
    if (!refusal.id) return;
    remove.mutate(refusal.id, { onSuccess: () => restore(url) });
  };

  return (
    <div className="algorithm-enter flex aspect-video flex-col justify-center gap-3 rounded-md border border-dashed border-border px-4">
      <p className="text-sm text-fg">
        {refusal.explained ? m.home_algo_noted() : m.home_algo_removed()}
      </p>
      {!refusal.explained && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-fg-soft">{m.home_algo_why()}</p>
          <div className="flex flex-wrap gap-2">
            {VIDEO_REFUSAL_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => explain(reason)}
                disabled={!refusal.id}
                className={CHIP}
              >
                {REASON_LABEL[reason]()}
              </button>
            ))}
          </div>
        </div>
      )}
      {refusal.notThisSubject && subject && !hide.isSuccess && (
        <button
          type="button"
          onClick={() => hide.mutate(subject.id)}
          disabled={hide.isPending}
          className={`${CHIP} w-fit`}
        >
          {m.home_algo_hide_subject({ subject: subject.title })}
        </button>
      )}
      {hide.isSuccess && <p className="text-xs text-fg-soft">{m.home_algo_subject_hidden()}</p>}
      <button
        type="button"
        onClick={undo}
        disabled={!refusal.id || remove.isPending}
        className="w-fit text-xs text-fg-soft transition-colors hover:text-fg disabled:cursor-not-allowed"
      >
        {m.home_algo_undo()}
      </button>
    </div>
  );
}
