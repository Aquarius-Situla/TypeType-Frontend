import { ChartPie, LayoutList, Tags } from "lucide-react";
import { useHomeRecommendations } from "../../hooks/use-home-recommendations";
import type { Recommender } from "../../hooks/use-recommender";
import type { AlgorithmTarget } from "../../lib/algorithm-sections";
import { m } from "../../paraglide/messages.js";
import { Donut, type DonutPart } from "./algorithm-donut";
import { Group } from "./algorithm-group";
import { formatNumber, reasonLabel } from "./algorithm-labels";
import { AlgorithmPanel } from "./algorithm-panel";
import { Row } from "./algorithm-row";

type Props = { recommender: Recommender; onOpen: (target: AlgorithmTarget) => void };

const whole = (value: number) => formatNumber(Math.round(value));
const SHARE_PARTS = 10;

export function AlgorithmOverview({ recommender, onOpen }: Props) {
  const { current, settings, profile } = recommender;
  const { rows, algorithm } = useHomeRecommendations();
  if (!settings.enabled) {
    return <p className="px-1 text-sm leading-6 text-fg-muted">{m.algo_overview_off()}</p>;
  }
  if (!algorithm) {
    return <p className="px-1 text-sm leading-6 text-fg-muted">{m.algo_overview_fallback()}</p>;
  }
  const byReason = new Map<string, DonutPart>();
  for (const row of rows) {
    const label = reasonLabel(row.reason);
    const part = byReason.get(label) ?? { id: label, label, value: 0 };
    byReason.set(label, { ...part, value: part.value + row.videoUrls.length });
  }
  const shown = rows.reduce((sum, row) => sum + row.videoUrls.length, 0);
  const ignored = new Set(settings.ignoredSignals);
  const groups = profile?.groups ?? [];
  const counted = groups.filter((group) => !group.muted && !ignored.has(group.id));
  const heaviest = [...counted].sort((a, b) => b.weight - a.weight);
  const others = heaviest.slice(SHARE_PARTS).reduce((sum, group) => sum + group.weight, 0);
  const shareParts: DonutPart[] = heaviest
    .slice(0, SHARE_PARTS)
    .map((group) => ({ id: group.id, label: group.label, value: group.weight }));
  if (others > 0) {
    shareParts.push({
      id: "others",
      label: m.algo_share_others({ count: heaviest.length - SHARE_PARTS }),
      value: others,
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-10 2xl:grid-cols-2">
        <AlgorithmPanel
          label={m.algo_composition_label()}
          icon={ChartPie}
          help={m.algo_help_composition()}
          description={current?.name}
          onAdjust={() => onOpen({ section: "algorithm" })}
        >
          <Donut
            size={208}
            parts={[...byReason.values()]}
            centerValue={shown}
            formatCenter={whole}
            centerLabel={m.algo_composition_center()}
            unit={(value) => m.algo_videos({ count: value })}
          />
        </AlgorithmPanel>
        <AlgorithmPanel
          label={m.algo_share_label()}
          icon={Tags}
          help={m.algo_help_interests()}
          onAdjust={() => onOpen({ section: "profile" })}
        >
          <Donut
            size={208}
            parts={shareParts}
            centerValue={counted.length}
            formatCenter={whole}
            centerLabel={m.algo_share_center()}
            onSelect={(id) => onOpen({ section: "profile", highlight: id })}
          />
        </AlgorithmPanel>
      </div>
      <Group label={m.algo_rows_label()} icon={LayoutList} help={m.algo_rows_description()}>
        {rows.map((row) => (
          <Row key={row.id} label={row.title} description={reasonLabel(row.reason)}>
            <span className="shrink-0 text-xs tabular-nums text-fg-muted">
              {m.algo_videos({ count: row.videoUrls.length })}
            </span>
          </Row>
        ))}
      </Group>
    </div>
  );
}
