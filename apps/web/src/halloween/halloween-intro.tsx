import { Ghost, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { m } from "../paraglide/messages.js";

type Props = {
  ready: boolean;
  onEnter: () => void;
  onClose: () => void;
};

export function HalloweenIntro({ ready, onEnter, onClose }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        role="none"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="halloween-intro-title"
        className="fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border-strong bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <Ghost size={20} className="text-accent" aria-hidden="true" />
          <p id="halloween-intro-title" className="text-base font-semibold text-fg">
            {m.halloween_mode()}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-fg-muted">
          {m.halloween_intro_lead()} {m.halloween_intro_fullscreen({ key: "F11" })}
        </p>
        <div className="flex gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <p className="leading-relaxed">{m.halloween_intro_warning()}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-strong px-3.5 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-soft hover:text-fg"
          >
            {m.halloween_intro_skip()}
          </button>
          <button
            type="button"
            onClick={onEnter}
            disabled={!ready}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-sm text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {m.halloween_intro_enter()}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
