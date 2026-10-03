import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

export function useGroupActionMenu(disabled: boolean): {
  id: string;
  open: boolean;
  trigger: React.RefObject<HTMLButtonElement | null>;
  menu: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: (restoreFocus?: boolean) => void;
  onTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onMenuKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
} {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const startAtEnd = useRef(false);

  function close(restoreFocus = false): void {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    if (disabled) {
      setOpen(false);
      return;
    }
    const items = menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    items?.[startAtEnd.current ? items.length - 1 : 0]?.focus();
    function dismiss(event: Event): void {
      const target = event.target;
      if (
        target instanceof Node &&
        !menu.current?.contains(target) &&
        !trigger.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open, disabled]);

  return {
    id,
    open,
    trigger,
    menu,
    close,
    toggle: () => {
      startAtEnd.current = false;
      setOpen((value) => !value);
    },
    onTriggerKeyDown: (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      startAtEnd.current = event.key === "ArrowUp";
      setOpen(true);
    },
    onMenuKeyDown: (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === "Tab") {
        close(true);
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const items = Array.from(
          menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
        );
        const current =
          document.activeElement instanceof HTMLButtonElement
            ? items.indexOf(document.activeElement)
            : -1;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      }
    },
  };
}
