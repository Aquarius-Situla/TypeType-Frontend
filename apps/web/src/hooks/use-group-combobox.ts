import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { SubscriptionGroup } from "../types/subscription-groups";

export function useGroupCombobox(
  groups: SubscriptionGroup[],
  selected: ReadonlySet<string>,
  onToggle: (id: string) => void,
): {
  input: React.RefObject<HTMLInputElement | null>;
  root: React.RefObject<HTMLFieldSetElement | null>;
  list: React.RefObject<HTMLDivElement | null>;
  listId: string;
  query: string;
  open: boolean;
  active: number;
  placement: { above: boolean; height: number };
  matches: SubscriptionGroup[];
  chosen: SubscriptionGroup[];
  setOpen: (open: boolean) => void;
  search: (query: string) => void;
  choose: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
} {
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLFieldSetElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [placement, setPlacement] = useState({ above: false, height: 224 });
  const chosen = groups.filter((group) => selected.has(group.id));
  const matches = groups.filter(
    (group) =>
      !selected.has(group.id) &&
      group.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const active = Math.min(highlighted, matches.length - 1);
  useLayoutEffect(() => {
    if (chosen.length > 0 && document.activeElement === input.current) {
      input.current?.scrollIntoView({ block: "nearest" });
    }
  }, [chosen.length]);
  useLayoutEffect(() => {
    if (!open) return;
    function position(): void {
      const bounds = root.current?.getBoundingClientRect();
      if (!bounds) return;
      const below = window.innerHeight - bounds.bottom - 12;
      const above = bounds.top - 68;
      const flip = below < Math.min(224, Math.max(40, matches.length * 36)) && above > below;
      setPlacement({ above: flip, height: Math.max(40, Math.min(224, flip ? above : below)) });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, matches.length]);
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  function search(value: string): void {
    setQuery(value);
    setHighlighted(0);
    setOpen(true);
  }
  function choose(id: string): void {
    onToggle(id);
    setQuery("");
    setHighlighted(0);
    input.current?.focus();
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlighted(
        !open
          ? event.key === "ArrowDown"
            ? 0
            : Math.max(0, matches.length - 1)
          : Math.max(
              0,
              Math.min(matches.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)),
            ),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && matches[active]) choose(matches[active].id);
      else setOpen(true);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Backspace" && !query && chosen.length) {
      event.preventDefault();
      onToggle(chosen[chosen.length - 1].id);
    }
  }
  return {
    input,
    root,
    list,
    listId,
    query,
    open,
    active,
    placement,
    matches,
    chosen,
    setOpen,
    search,
    choose,
    onKeyDown,
  };
}
