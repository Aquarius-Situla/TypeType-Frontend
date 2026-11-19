import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type SectionShellItem<Key extends string> = {
  key: Key;
  label: string;
  description: string;
  icon: LucideIcon;
};

type Props<Key extends string> = {
  title: string;
  subtitle: string;
  items: SectionShellItem<Key>[];
  active: Key;
  onSelect: (key: Key) => void;
  search?: ReactNode;
  results?: ReactNode;
  children: ReactNode;
};

export function SectionShell<Key extends string>({
  title,
  subtitle,
  items,
  active,
  onSelect,
  search,
  results,
  children,
}: Props<Key>) {
  const current = items.find((item) => item.key === active) ?? items[0];
  const CurrentIcon = current?.icon;

  return (
    <div className="min-w-0 pt-5 [animation:page-fade-in_0.2s_ease-out] sm:pt-8">
      <header data-interface-copy className="mb-7 border-b border-border pb-6">
        <h1 className="typetype-adaptive-label text-2xl font-bold text-fg">{title}</h1>
        <p className="typetype-adaptive-label mt-1.5 max-w-2xl text-sm leading-6 text-fg-muted">
          {subtitle}
        </p>
        {search}
      </header>
      {results ?? (
        <>
          <div className="mb-5 lg:hidden">
            <label htmlFor="section-navigation" className="sr-only">
              {title}
            </label>
            <select
              id="section-navigation"
              value={active}
              onChange={(event) => onSelect(event.target.value as Key)}
              className="h-11 w-full rounded-sm border border-border-strong bg-app px-3 text-sm text-fg"
            >
              {items.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid min-w-0 gap-8 lg:grid-cols-[228px_minmax(0,1fr)] lg:gap-10">
            <nav className="hidden border-r border-border pr-4 lg:block" aria-label={title}>
              <div data-interface-copy className="sticky top-20 space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const selected = item.key === active;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-current={selected ? "page" : undefined}
                      onClick={() => onSelect(item.key)}
                      className={`grid min-h-11 w-full min-w-0 grid-cols-[20px_minmax(0,1fr)] items-center gap-2 border-l-2 px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-accent text-fg"
                          : "border-transparent text-fg-muted hover:border-border-strong hover:text-fg"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="typetype-adaptive-label text-sm font-medium leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
            <main className="min-w-0">
              <header data-interface-copy className="mb-6">
                <div className="flex items-center gap-2">
                  {CurrentIcon && (
                    <CurrentIcon className="size-5 text-fg-muted" aria-hidden="true" />
                  )}
                  <h2 className="typetype-adaptive-label text-lg font-semibold text-fg">
                    {current?.label}
                  </h2>
                </div>
                <p className="typetype-adaptive-label mt-1 text-sm text-fg-muted">
                  {current?.description}
                </p>
              </header>
              <div data-interface-copy>{children}</div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
