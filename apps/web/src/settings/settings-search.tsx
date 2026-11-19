import { Search, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";
import type { SettingsSearchEntry } from "../lib/settings-search";
import type { SettingsSection } from "../lib/settings-section";
import { m } from "../paraglide/messages.js";

type Entry = SettingsSearchEntry<SettingsSection>;

export function SettingsSearchField({
  query,
  onQuery,
  onOpenFirst,
}: {
  query: string;
  onQuery: (query: string) => void;
  onOpenFirst: () => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") onOpenFirst();
    if (event.key === "Escape") onQuery("");
    if (event.key === "ArrowDown") {
      event.preventDefault();
      document.querySelector<HTMLButtonElement>("[data-settings-result]")?.focus();
    }
  };
  return (
    <div className="relative mt-4 max-w-md">
      <Search
        className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-fg-soft"
        aria-hidden="true"
      />
      <input
        type="search"
        data-settings-search=""
        value={query}
        onChange={(event) => onQuery(event.currentTarget.value)}
        onKeyDown={onKeyDown}
        placeholder={m.settings_search_placeholder()}
        aria-label={m.settings_search_placeholder()}
        className="h-10 w-full rounded-sm border border-border-strong bg-app pr-10 pl-9 text-sm text-fg placeholder:text-fg-soft [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={() => onQuery("")}
          aria-label={m.settings_search_clear()}
          className="-translate-y-1/2 absolute top-1/2 right-1 grid size-8 place-items-center rounded-sm text-fg-soft hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function SettingsSearchResults({
  query,
  results,
  onOpen,
}: {
  query: string;
  results: Entry[];
  onOpen: (entry: Entry) => void;
}) {
  const move = (event: KeyboardEvent<HTMLButtonElement>, step: number) => {
    event.preventDefault();
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-settings-result]")];
    const next = buttons.indexOf(event.currentTarget) + step;
    if (next < 0) document.querySelector<HTMLInputElement>("[data-settings-search]")?.focus();
    else buttons[next]?.focus();
  };
  if (results.length === 0) {
    return <p className="py-5 text-fg-muted text-sm">{m.settings_search_empty({ query })}</p>;
  }
  return (
    <ul
      aria-label={m.settings_search_results()}
      className="divide-y divide-border border-border border-b"
    >
      {results.map((entry) => (
        <li key={`${entry.section}:${entry.title}`}>
          <button
            type="button"
            data-settings-result=""
            onClick={() => onOpen(entry)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") move(event, 1);
              if (event.key === "ArrowUp") move(event, -1);
            }}
            className="flex w-full min-w-0 flex-col gap-0.5 px-1 py-3 text-left hover:bg-surface focus-visible:bg-surface"
          >
            <span className="text-fg text-sm">{entry.title}</span>
            <span className="text-fg-soft text-xs">
              {entry.sectionLabel}
              {entry.detail && entry.title !== entry.sectionLabel ? ` · ${entry.detail}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const CONTROL = "input, select, textarea, button, [role=switch]";
const LABEL_SELECTOR = ["span", "p", "label", "h3", "legend"].join(",");
const FIND_FOR_MS = 1_500;

function findRow(title: string): { row: HTMLElement; control: HTMLElement | null } | null {
  const main = document.querySelector("main");
  if (!main) return null;
  const label = [...main.querySelectorAll<HTMLElement>(LABEL_SELECTOR)].find(
    (element) => element.textContent?.trim() === title,
  );
  if (!label) return null;
  let row: HTMLElement | null = label;
  while (row && row !== main && !row.querySelector(CONTROL)) row = row.parentElement;
  if (!row || row === main) return { row: label, control: null };
  return { row, control: row.querySelector<HTMLElement>(CONTROL) };
}

function flash(row: HTMLElement) {
  row.dataset.settingsHit = "";
  setTimeout(() => delete row.dataset.settingsHit, 1_600);
}

// A section loads some rows after its data: the setting is looked for until it shows, then brought into view and its
// control focused, so the keyboard lands where the search pointed.
export function useRevealSetting(title: string | null, onDone: () => void) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!title) return;
    const started = performance.now();
    let frame = 0;
    const look = () => {
      const found = findRow(title);
      if (!found && performance.now() - started < FIND_FOR_MS) {
        frame = requestAnimationFrame(look);
        return;
      }
      if (found) {
        found.row.scrollIntoView({ block: "center", behavior: "smooth" });
        found.control?.focus({ preventScroll: true });
        flash(found.row);
      }
      done.current();
    };
    frame = requestAnimationFrame(look);
    return () => cancelAnimationFrame(frame);
  }, [title]);
}
