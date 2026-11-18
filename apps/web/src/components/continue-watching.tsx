import { useMemo } from "react";
import { useAuth } from "../hooks/use-auth";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useHistory } from "../hooks/use-history";
import { useWatchedThreshold } from "../hooks/use-watched-threshold";
import { isVideoInProgress } from "../lib/watch-progress";
import { m } from "../paraglide/messages.js";
import { ContinueCard } from "./continue-card";

const MAX_ITEMS = 12;

export function ContinueWatching() {
  const { items } = useHistory();
  const { isAuthed } = useAuth();
  const { filter } = useBlockedFilter();
  const watchedThreshold = useWatchedThreshold();
  const displayed = useMemo(
    () =>
      filter(items)
        .filter((h) => isVideoInProgress(h.progress, h.duration, watchedThreshold))
        .sort((a, b) => b.watchedAt - a.watchedAt)
        .slice(0, MAX_ITEMS),
    [filter, items, watchedThreshold],
  );
  if (!isAuthed || displayed.length === 0) return null;

  return (
    <section className="mt-2 flex flex-col gap-3 sm:mt-3">
      <p className="text-xs font-medium text-fg-soft uppercase tracking-wider px-1">
        {m.ui_continue_watching()}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {displayed.map((item, index) => (
          <div
            key={item.id}
            className="animate-card-pop-in first:pl-0.5 sm:first:pl-0"
            style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
          >
            <ContinueCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
