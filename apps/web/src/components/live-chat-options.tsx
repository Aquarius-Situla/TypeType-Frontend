import { Ellipsis } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";

type Props = {
  compact: boolean;
  timestamps: boolean;
  onCompact: (value: boolean) => void;
  onTimestamps: (value: boolean) => void;
};
export function LiveChatOptions({ compact, timestamps, onCompact, onTimestamps }: Props) {
  const { locale } = useInterfaceLocale();
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);
  const title = m.watch_live_chat_options({}, { locale });
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={title}
        title={title}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex size-8 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
      >
        <Ellipsis size={19} />
      </button>
      {open && (
        <div
          id={id}
          className="absolute right-0 top-9 z-10 w-52 rounded border border-white/15 bg-[#25252b] p-2 shadow-lg"
        >
          <label className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2.5 text-xs hover:bg-white/5">
            <input
              type="checkbox"
              checked={timestamps}
              onChange={(event) => onTimestamps(event.target.checked)}
              className="accent-emerald-300"
            />
            {m.watch_live_chat_timestamps({}, { locale })}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2.5 text-xs hover:bg-white/5">
            <input
              type="checkbox"
              checked={compact}
              onChange={(event) => onCompact(event.target.checked)}
              className="accent-emerald-300"
            />
            {m.watch_live_chat_compact({}, { locale })}
          </label>
        </div>
      )}
    </div>
  );
}
