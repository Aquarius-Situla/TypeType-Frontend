import { Ghost, LoaderCircle } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { useLightsOutStore } from "./lights-out-store";

type Props = {
  onOpen: () => void;
};

export function HalloweenButton({ onOpen }: Props) {
  const phase = useLightsOutStore((state) => state.phase);
  const loading = phase === "loading";
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={phase !== "idle"}
      aria-label={m.halloween_mode()}
      title={m.halloween_mode()}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-fg disabled:opacity-60"
    >
      {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Ghost size={18} />}
      <span className="hidden lg:inline">{m.halloween_button()}</span>
    </button>
  );
}
