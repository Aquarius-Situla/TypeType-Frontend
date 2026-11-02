import { Link } from "@tanstack/react-router";
import { ListX, Play, X } from "lucide-react";
import type { PlaybackQueue } from "../lib/playback-queue";
import { m } from "../paraglide/messages.js";

type Props = {
  queue: PlaybackQueue;
  onRemove: (param: string) => void;
  onClear: () => void;
};

export function WatchQueuePanel({ queue, onRemove, onClear }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-border border-b px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="font-medium text-fg text-sm">{m.queue_title()}</h2>
          <p className="mt-1 text-fg-soft text-xs">
            {m.queue_position({ current: queue.currentIndex + 1, total: queue.entries.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label={m.queue_clear()}
          title={m.queue_clear()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
        >
          <ListX className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="max-h-[24rem] list-none overflow-y-auto py-1">
        {queue.entries.map((entry, index) => {
          const isCurrent = index === queue.currentIndex;
          return (
            <li
              key={entry.param}
              aria-current={isCurrent ? "true" : undefined}
              className={`group flex items-center gap-1 px-2 transition-colors hover:bg-surface-strong/60 ${
                isCurrent ? "bg-surface-strong/60" : ""
              }`}
            >
              <Link
                to="/watch"
                search={{ v: entry.param }}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5"
              >
                <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-surface-strong">
                  {entry.thumbnail && (
                    <img
                      src={entry.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Play className="h-4 w-4 fill-white text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`line-clamp-2 text-xs leading-snug ${
                      isCurrent ? "font-medium text-fg" : "text-fg-muted"
                    }`}
                  >
                    {entry.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-fg-soft">
                    {isCurrent ? m.queue_now_playing() : entry.channelName}
                  </p>
                </div>
              </Link>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => onRemove(entry.param)}
                  aria-label={m.queue_remove()}
                  title={m.queue_remove()}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-soft opacity-100 transition-colors hover:bg-surface-strong hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
