import { House, Inbox, ListVideo, SlidersHorizontal, Timer } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import { useSettings } from "../../hooks/use-settings";
import { m } from "../../paraglide/messages.js";
import { ToggleSwitch } from "../../settings/settings-toggle-switch";
import type { RecommenderDataCategory } from "../../types/recommender";
import { ItemRow } from "./algorithm-data-item-row";
import { Group } from "./algorithm-group";
import { retentionShort } from "./algorithm-labels";
import { Row } from "./algorithm-row";
import { Segmented } from "./algorithm-segmented";

const RETENTION: (number | null)[] = [7, 30, 90, 180, 365, null];
const EXCLUDABLE = new Set(["history", "shorts_history", "favorites"]);

type Props = { recommender: Recommender; category: RecommenderDataCategory };

export function AlgorithmDataDetail({ recommender, category }: Props) {
  const { toggleUse, setRetention, toggleExcluded } = recommender;
  const { settings, update } = useSettings();
  const excludable = EXCLUDABLE.has(category.id);

  return (
    <div className="flex flex-col gap-8">
      <Group label={m.algo_category_settings()} icon={SlidersHorizontal}>
        {category.collect !== null && (
          <Row
            icon={Inbox}
            label={m.algo_collect()}
            description={m.algo_collect_description()}
            help={m.algo_help_collect()}
          >
            <ToggleSwitch
              checked={!settings.disableWatchHistory}
              ariaLabel={m.algo_collect()}
              onClick={() => update.mutate({ disableWatchHistory: !settings.disableWatchHistory })}
            />
          </Row>
        )}
        <Row
          icon={House}
          label={m.algo_use_for_home()}
          description={m.algo_use_for_home_description()}
          help={m.algo_help_use()}
        >
          <ToggleSwitch
            checked={category.use}
            ariaLabel={m.algo_use_for_home()}
            onClick={() => toggleUse(category.id)}
          />
        </Row>
        {excludable && (
          <Row
            icon={Timer}
            label={m.algo_keep_for()}
            description={m.algo_keep_for_description()}
            help={m.algo_help_retention()}
          >
            <Segmented
              label={m.algo_keep_for()}
              value={category.retentionDays}
              options={RETENTION.map((days) => ({ value: days, label: retentionShort(days) }))}
              onChange={(days) => setRetention(category.id, days)}
            />
          </Row>
        )}
      </Group>

      <Group
        label={m.algo_items_label({ shown: category.items.length, count: category.count })}
        icon={ListVideo}
      >
        {category.items.length === 0 && (
          <p className="py-3 text-xs text-fg-soft">{m.algo_empty()}</p>
        )}
        {category.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={excludable ? () => toggleExcluded(item.id) : undefined}
          />
        ))}
      </Group>
    </div>
  );
}
