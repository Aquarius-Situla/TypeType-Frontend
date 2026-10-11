import { useInterfaceLocale } from "../../hooks/use-interface-locale";
import { m } from "../../paraglide/messages.js";
import { useCorridorHint } from "../corridor-hint-store";
import { useKeyLabels } from "../key-labels";

export function CorridorHint() {
  const hint = useCorridorHint((state) => state.hint);
  useInterfaceLocale();
  const key = useKeyLabels((state) => state.labels.KeyE);
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-12 left-1/2 z-[75] flex -translate-x-1/2 items-center gap-2.5 font-mono text-sm text-white/75 transition-opacity duration-500 ${hint ? "opacity-100" : "opacity-0"}`}
    >
      <kbd className="rounded border border-white/40 px-2 py-0.5 text-white/90">{key}</kbd>
      <span>{m.halloween_hint_alarm()}</span>
    </div>
  );
}
