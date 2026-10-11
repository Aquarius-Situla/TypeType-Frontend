import { useEffect, useState } from "react";
import { useHighlight } from "../../hooks/use-highlight";
import type { Recommender } from "../../hooks/use-recommender";
import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import { ROW } from "../../settings/settings-toggle-switch";
import { useAlgorithmHighlightStore } from "../../stores/algorithm-highlight-store";
import type { ProfileGroup } from "../../types/recommender";
import { DANGER_ACTION, TEXT_ACTION } from "./algorithm-classes";
import { Collapse } from "./algorithm-collapse";
import { basedOn } from "./algorithm-labels";

type Props = { group: ProfileGroup; recommender: Recommender };

export function AlgorithmInterestRow({ group, recommender }: Props) {
  const { settings, togglePinned, toggleMuted, toggleIgnored } = recommender;
  const highlight = useAlgorithmHighlightStore((state) => state.highlight);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (highlight === group.id) setOpen(true);
  }, [highlight, group.id]);
  const lit = useHighlight<HTMLDivElement>(group.id);
  const ignored = settings.ignoredSignals.includes(group.id);
  const pinned = group.pinned || settings.pinnedGroups.includes(group.id);
  const muted = group.muted || settings.mutedGroups.includes(group.id);
  const examples = (group.examples ?? []).filter((example) => example.thumbnailUrl);
  const custom = group.id.startsWith("custom:");
  const pinnable = group.id.startsWith("group:");
  const status = [
    custom ? m.algo_interest_yours() : basedOn(group.from.length),
    pinned && !custom ? m.algo_pinned() : null,
    muted ? m.algo_muted() : null,
    ignored ? m.algo_ignored() : null,
  ].filter(Boolean);
  return (
    <div ref={lit.ref} className={`${ROW} ${lit.className}`}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`w-fit text-left text-sm transition-colors duration-300 ${muted || ignored ? "text-fg-soft" : "text-fg"}`}
        >
          {group.label}
        </button>
        <span className="text-xs text-fg-soft">{status.join(" · ")}</span>
        {examples.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {examples.map((example) => (
              <img
                key={example.url}
                src={proxyImage(example.thumbnailUrl ?? "")}
                alt={example.title ?? ""}
                title={example.title}
                loading="lazy"
                className={`aspect-video w-20 rounded-sm bg-surface object-cover transition-opacity ${muted || ignored ? "opacity-40" : ""}`}
              />
            ))}
            {examples[0]?.title && (
              <span className="min-w-0 flex-1 truncate text-xs text-fg-soft">
                {examples[0].title}
              </span>
            )}
          </div>
        )}
        <Collapse open={open}>
          <button
            type="button"
            onClick={() => toggleIgnored(group.id)}
            className={`${TEXT_ACTION} mt-2 w-fit`}
          >
            {ignored ? m.algo_count_again() : m.algo_ignore()}
          </button>
        </Collapse>
      </div>
      {custom ? (
        <button
          type="button"
          onClick={() => recommender.removeInterest(group.label)}
          className={DANGER_ACTION}
        >
          {m.algo_interest_remove()}
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-4">
          {pinnable && (
            <button type="button" onClick={() => togglePinned(group.id)} className={TEXT_ACTION}>
              {pinned ? m.algo_unpin() : m.algo_pin()}
            </button>
          )}
          <button type="button" onClick={() => toggleMuted(group.id)} className={TEXT_ACTION}>
            {muted ? m.algo_show() : m.algo_hide()}
          </button>
        </div>
      )}
    </div>
  );
}
