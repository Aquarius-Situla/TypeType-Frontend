import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getOpenMojiUrl } from "../lib/openmoji";
import { m } from "../paraglide/messages.js";

type Props = {
  ready: boolean;
  onEnter: () => void;
  onClose: () => void;
};

export function HalloweenIntro({ ready, onEnter, onClose }: Props) {
  const [accelerationConfirmed, setAccelerationConfirmed] = useState(false);
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
        className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border-strong bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <img
            src={getOpenMojiUrl("1F383")}
            alt=""
            aria-hidden="true"
            className="size-5 shrink-0"
          />
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
        <section className="rounded-lg border border-border-strong bg-surface-soft p-3">
          <p className="text-sm font-semibold text-fg">{m.halloween_acceleration_required()}</p>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            {m.halloween_acceleration_explanation()}
          </p>
          <details open className="mt-3 text-sm text-fg">
            <summary className="cursor-pointer font-medium text-accent">
              {m.halloween_acceleration_guide()}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <h3 className="font-semibold">{m.halloween_acceleration_chrome()}</h3>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-fg-muted">
                  <li>{m.halloween_acceleration_chrome_1()}</li>
                  <li>{m.halloween_acceleration_chrome_2()}</li>
                  <li>{m.halloween_acceleration_chrome_3()}</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold">{m.halloween_acceleration_firefox()}</h3>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-fg-muted">
                  <li>{m.halloween_acceleration_firefox_1()}</li>
                  <li>{m.halloween_acceleration_firefox_2()}</li>
                  <li>{m.halloween_acceleration_firefox_3()}</li>
                </ol>
                <a
                  href="https://support.mozilla.org/en-US/kb/performance-settings"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-accent underline underline-offset-2"
                >
                  {m.halloween_acceleration_help()}
                </a>
              </div>
            </div>
          </details>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={accelerationConfirmed}
              onChange={(event) => setAccelerationConfirmed(event.currentTarget.checked)}
              className="mt-1 size-4 shrink-0 accent-accent"
            />
            <span>{m.halloween_acceleration_confirm()}</span>
          </label>
        </section>
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
            disabled={!ready || !accelerationConfirmed}
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
