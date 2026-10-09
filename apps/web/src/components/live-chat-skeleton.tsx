export function LiveChatSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4 px-3.5 py-4">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="flex items-start gap-2.5 animate-pulse motion-reduce:animate-none"
        >
          <span className="size-[25px] shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2 pt-1">
            <span className="block h-2.5 w-20 rounded bg-white/10" />
            <span className={`block h-2.5 rounded bg-white/5 ${row % 2 ? "w-2/3" : "w-4/5"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
