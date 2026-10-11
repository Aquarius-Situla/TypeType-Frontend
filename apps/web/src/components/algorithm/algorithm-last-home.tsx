import { Eye, Funnel, House, LayoutList, ListOrdered, Search } from "lucide-react";
import { useState } from "react";
import type { Recommender } from "../../hooks/use-recommender";
import { useRecommenderLastHome } from "../../hooks/use-recommender-data";
import { m } from "../../paraglide/messages.js";
import { TEXT_ACTION } from "./algorithm-classes";
import { Collapse } from "./algorithm-collapse";
import { AlgorithmFold } from "./algorithm-fold";
import { ago, dropLabel, formatNumber } from "./algorithm-labels";
import { Row } from "./algorithm-row";

type Props = { recommender: Recommender; open: boolean; onToggle: () => void };

export function AlgorithmLastHome({ recommender, open, onToggle }: Props) {
  const [rowsOpen, setRowsOpen] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);
  const trace = useRecommenderLastHome().data;
  if (!trace) return <p className="py-3 text-xs text-fg-soft">{m.algo_last_home_none()}</p>;
  const name =
    recommender.algorithms.find((a) => a.id === trace.algorithm)?.name ?? trace.algorithm;
  const kinds = (kind: string) => trace.sources.filter((source) => source.kind === kind).length;
  const sources = [
    kinds("subscription_feed") ? m.algo_source_subscriptions() : null,
    kinds("related") ? m.algo_source_related({ count: kinds("related") }) : null,
    kinds("channel_videos") ? m.algo_source_channels({ count: kinds("channel_videos") }) : null,
    kinds("search") ? m.algo_source_search({ count: kinds("search") }) : null,
    kinds("trending") ? m.algo_source_trending() : null,
  ]
    .filter(Boolean)
    .join(", ");
  const dropped = Object.values(trace.dropped).reduce((sum, count) => sum + count, 0);
  const built = [ago(trace.builtAt), m.algo_computed_by({ name })].join(" · ");
  const reasons = Object.entries(trace.dropped)
    .map(([why, count]) => dropLabel(why, count))
    .join(" · ");

  return (
    <AlgorithmFold
      icon={House}
      label={m.algo_last_home_fold()}
      description={built}
      summary={m.algo_last_home_summary({
        found: formatNumber(trace.candidatesReceived),
        shown: formatNumber(trace.shown),
      })}
      open={open}
      onToggle={onToggle}
    >
      <Row
        icon={Search}
        label={m.algo_found({ count: trace.candidatesReceived })}
        description={sources}
      />
      <Row icon={Funnel} label={m.algo_dropped({ count: dropped })} description={reasons} />
      <Row
        icon={Eye}
        label={m.algo_shown({ count: trace.shown })}
        description={m.algo_shown_rows({ rows: trace.rows.length })}
      />
      <div>
        <Row
          icon={LayoutList}
          label={m.algo_rows_count({ count: trace.rows.length })}
          description={m.algo_rows_description()}
        >
          <button type="button" onClick={() => setRowsOpen(!rowsOpen)} className={TEXT_ACTION}>
            {rowsOpen ? m.algo_hide() : m.algo_show()}
          </button>
        </Row>
        <Collapse open={rowsOpen}>
          <div className="mb-3 ml-7 divide-y divide-border">
            {trace.rows.map((row) => (
              <Row
                key={row.id}
                label={row.title}
                description={[row.why, m.algo_videos({ count: row.videos })]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </div>
        </Collapse>
      </div>
      <div>
        <Row
          icon={ListOrdered}
          label={m.algo_scores_label({ count: trace.scores.length })}
          description={m.algo_scores_description()}
        >
          <button type="button" onClick={() => setScoresOpen(!scoresOpen)} className={TEXT_ACTION}>
            {scoresOpen ? m.algo_hide() : m.algo_show()}
          </button>
        </Row>
        <Collapse open={scoresOpen}>
          <div className="mb-3 ml-7 divide-y divide-border">
            {trace.scores.map((score) => (
              <Row
                key={score.url}
                label={score.title || score.url}
                description={[
                  score.channel,
                  score.row,
                  ...Object.entries(score.factors)
                    .filter(([, value]) => value !== 0)
                    .map(([factor, value]) => `${factor} ${formatNumber(value)}`),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                  {formatNumber(score.total)}
                </span>
              </Row>
            ))}
          </div>
        </Collapse>
      </div>
    </AlgorithmFold>
  );
}
