import { ChevronRight, Database } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import { useRecommenderData } from "../../hooks/use-recommender-data";
import { m } from "../../paraglide/messages.js";
import { ROW, ToggleSwitch } from "../../settings/settings-toggle-switch";
import { AlgorithmDataDetail } from "./algorithm-data-detail";
import { Group } from "./algorithm-group";
import { dataIcon, dataLabel, itemCount } from "./algorithm-labels";
import { Unavailable } from "./algorithm-unavailable";
import { AnimatedNumber } from "./animated-number";

type Props = {
  recommender: Recommender;
  category: string | undefined;
  onOpen: (category: string) => void;
};

export function AlgorithmData({ recommender, category, onOpen }: Props) {
  const { current, settings, toggleUse } = recommender;
  const data = useRecommenderData(settings);
  if (!data.data) {
    if (data.isError)
      return <Unavailable onRetry={() => data.refetch()} retrying={data.isFetching} />;
    return <p className="px-1 text-sm text-fg-muted">{m.ui_loading()}</p>;
  }
  const open = data.data.find((item) => item.id === category);
  if (open) return <AlgorithmDataDetail recommender={recommender} category={open} />;
  const name = current?.name ?? "";

  return (
    <Group label={m.algo_data_label()} icon={Database} help={m.algo_help_stored_data()}>
      {data.data.map((item) => {
        const Icon = dataIcon(item.id);
        const read = current?.uses.includes(item.id) ?? false;
        const state =
          item.collect === false
            ? m.algo_not_collected()
            : item.use && read
              ? m.algo_used_by({ name })
              : item.use
                ? m.algo_not_needed_by({ name })
                : m.algo_kept_not_used();
        return (
          <div key={item.id} className={ROW}>
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="typetype-adaptive-label group -my-2 -ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-sm py-2 pl-2 text-left transition-colors hover:bg-surface-strong/60"
            >
              <Icon
                className="mt-0.5 size-4 shrink-0 self-start text-fg-muted"
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm text-fg">{dataLabel(item.id)}</span>
                <span className="text-xs text-fg-soft">
                  <AnimatedNumber value={item.count} format={(n) => itemCount(Math.round(n))} /> ·{" "}
                  {state}
                </span>
              </span>
              <ChevronRight
                className="mr-2 size-4 shrink-0 text-fg-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-fg"
                aria-hidden="true"
              />
            </button>
            <ToggleSwitch
              checked={item.use}
              ariaLabel={m.algo_use_category({ label: dataLabel(item.id) })}
              onClick={() => toggleUse(item.id)}
            />
          </div>
        );
      })}
    </Group>
  );
}
