import { Check } from "lucide-react";

type Props = {
  title: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export function SelectableCardOverlay({ title, selected, disabled, onToggle }: Props) {
  if (disabled) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 cursor-not-allowed rounded-xl bg-black/55"
      />
    );
  }
  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={selected}
      onClick={onToggle}
      className={`absolute inset-0 z-10 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        selected ? "bg-black/35 ring-2 ring-accent" : "hover:bg-black/20"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 ${
          selected ? "border-accent bg-accent text-white" : "border-white/80 bg-black/50"
        }`}
      >
        {selected && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  );
}
