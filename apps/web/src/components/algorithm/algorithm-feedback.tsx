import { MessageSquareText } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import { useRecommenderFeedback } from "../../hooks/use-recommender-feedback";
import { formatPublishedDate } from "../../lib/format";
import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import { getLocale } from "../../paraglide/runtime.js";
import type { RecommenderFeedback } from "../../types/recommender";
import { TEXT_ACTION } from "./algorithm-classes";
import { Group } from "./algorithm-group";
import { Row } from "./algorithm-row";

const REASON_LABEL: Record<string, () => string> = {
  seen: m.home_algo_reason_seen,
  channel: m.home_algo_reason_channel,
  topic: m.home_algo_reason_topic,
  other: m.home_algo_reason_other,
  repetitive: m.home_algo_page_repetitive,
  unrelated: m.home_algo_page_unrelated,
  old: m.home_algo_page_old,
  missing: m.home_algo_page_missing,
};

function subject(item: RecommenderFeedback): string | null | undefined {
  if (item.kind !== "video") return item.comment;
  return [item.title ?? item.videoUrl, item.channelName].filter(Boolean).join(" · ");
}

function verdictLabel(item: RecommenderFeedback): string {
  if (item.kind === "video") return m.algo_feedback_not_for_me();
  return item.verdict === "good" ? m.algo_feedback_good() : m.algo_feedback_bad();
}

export function AlgorithmFeedback({ recommender }: { recommender: Recommender }) {
  const { items, isLoading, remove } = useRecommenderFeedback();
  const nameOf = (id: string) => recommender.algorithms.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-2xl px-1 text-sm leading-6 text-fg-muted">{m.algo_feedback_intro()}</p>
      <Group label={m.algo_feedback_label()} icon={MessageSquareText}>
        {items.length === 0 && (
          <p className="py-3 text-xs text-fg-soft">
            {isLoading ? m.ui_loading() : m.algo_feedback_empty()}
          </p>
        )}
        {items.map((item) => (
          <Row
            key={item.id}
            label={
              <span className="flex items-center gap-3">
                {item.thumbnailUrl && (
                  <img
                    src={proxyImage(item.thumbnailUrl)}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-20 shrink-0 rounded-sm object-cover"
                  />
                )}
                <span>{verdictLabel(item)}</span>
              </span>
            }
            description={[
              subject(item),
              item.reason ? REASON_LABEL[item.reason]?.() : null,
              nameOf(item.algorithmId),
              formatPublishedDate(item.createdAt, undefined, getLocale()),
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <button
              type="button"
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
              className={TEXT_ACTION}
            >
              {m.algo_feedback_remove()}
            </button>
          </Row>
        ))}
      </Group>
    </div>
  );
}
