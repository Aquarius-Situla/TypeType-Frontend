import { Info } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "../../paraglide/messages.js";

const MAX_WIDTH = 288;
const MARGIN = 16;

type Place = { left: number; width: number; top?: number; bottom?: number };

export function InfoTip({ label, text }: { label: string; text: string }) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const shown = hovered || pinned;

  useLayoutEffect(() => {
    if (!shown) return;
    const measure = () => {
      const box = button.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.min(MAX_WIDTH, window.innerWidth - MARGIN * 2);
      const left = Math.min(
        Math.max(MARGIN, box.left + box.width / 2 - width / 2),
        window.innerWidth - MARGIN - width,
      );
      setPlace(
        box.bottom + 140 < window.innerHeight
          ? { left, width, top: box.bottom + 8 }
          : { left, width, bottom: window.innerHeight - box.top + 8 },
      );
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [shown]);

  useEffect(() => {
    if (!pinned) return;
    const outside = (event: PointerEvent) => {
      const inside = event.target instanceof Node && button.current?.contains(event.target);
      if (!inside) setPinned(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={m.algo_more_info({ name: label })}
        aria-describedby={shown ? id : undefined}
        aria-expanded={pinned}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          setHovered(false);
          setPinned(false);
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          // Decided on the pinned state alone: on touch screens, the focus that comes
          // with the tap already counts as hovering.
          if (pinned) setHovered(false);
          setPinned(!pinned);
        }}
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full align-middle transition-colors ${
          shown ? "text-accent" : "text-fg-soft hover:text-fg"
        }`}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      {shown &&
        place &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="algorithm-tip pointer-events-none fixed z-[70] rounded-md border border-border-strong bg-surface px-3 py-2 text-xs leading-5 text-fg-muted shadow-lg normal-case tracking-normal"
            style={place}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}
