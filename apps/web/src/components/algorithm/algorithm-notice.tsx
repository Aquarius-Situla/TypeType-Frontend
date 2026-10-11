export function Notice({
  text,
  action,
}: {
  text: string;
  action?: { label: string; run: () => void };
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
      <p className="max-w-md text-center text-sm leading-6 text-fg-muted">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.run}
          className="h-9 rounded-sm border border-border-strong px-4 text-sm text-fg transition-colors hover:bg-surface-strong"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
