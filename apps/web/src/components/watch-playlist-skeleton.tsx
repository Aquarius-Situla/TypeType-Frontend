const SKELETON_ITEMS = [
  "skeleton-item-1",
  "skeleton-item-2",
  "skeleton-item-3",
  "skeleton-item-4",
  "skeleton-item-5",
];

type Props = {
  title?: string;
  count?: number;
};

export function WatchPlaylistSkeleton({ title, count }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-border border-b px-3 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {title ? (
            <span className="truncate font-medium text-fg text-sm">{title}</span>
          ) : (
            <div className="h-4 w-32 rounded bg-fg/10 animate-pulse" />
          )}
          {count !== undefined ? (
            <span className="text-fg-soft text-xs">- / {count}</span>
          ) : (
            <div className="h-3 w-12 rounded bg-fg/10 animate-pulse" />
          )}
        </div>
      </div>
      <div className="max-h-[min(520px,65vh)] divide-y divide-border/60 overflow-hidden p-1.5">
        {SKELETON_ITEMS.map((key) => (
          <div key={key} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 animate-pulse">
            <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-surface-strong" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-3/4 rounded bg-fg/10" />
              <div className="h-3 w-1/3 rounded bg-fg/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
