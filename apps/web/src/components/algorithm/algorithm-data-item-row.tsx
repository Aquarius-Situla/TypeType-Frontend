import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import { ROW } from "../../settings/settings-toggle-switch";
import type { RecommenderDataItem } from "../../types/recommender";
import { TEXT_ACTION } from "./algorithm-classes";
import { ago } from "./algorithm-labels";

export function ItemRow({ item, onToggle }: { item: RecommenderDataItem; onToggle?: () => void }) {
  const details = [
    item.channel,
    ago(item.at),
    (item.viewings ?? 1) > 1 ? m.algo_viewings({ count: item.viewings ?? 1 }) : null,
    item.watchedPercent !== null ? m.algo_watched_share({ percent: item.watchedPercent }) : null,
    item.excluded ? m.algo_excluded() : null,
  ].filter(Boolean);
  return (
    <div className={ROW}>
      {item.thumbnailUrl && (
        <img
          src={proxyImage(item.thumbnailUrl)}
          alt=""
          loading="lazy"
          className={`aspect-video w-20 shrink-0 rounded-sm bg-surface object-cover ${item.excluded ? "opacity-40" : ""}`}
        />
      )}
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`text-sm transition-colors duration-300 ${item.excluded ? "text-fg-soft line-through" : "text-fg"}`}
        >
          {item.title}
        </span>
        <span className="text-xs text-fg-soft">{details.join(" · ")}</span>
      </div>
      {onToggle && (
        <button type="button" onClick={onToggle} className={TEXT_ACTION}>
          {item.excluded ? m.algo_include() : m.algo_exclude()}
        </button>
      )}
    </div>
  );
}
