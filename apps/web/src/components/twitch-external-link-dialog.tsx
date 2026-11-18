import { useEffect, useId, useRef } from "react";
import { m } from "../paraglide/messages.js";

type Props = { href: string; onClose: () => void };

export function TwitchExternalLinkDialog({ href, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const url = new URL(href);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  function open() {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(30rem,92vw)] rounded-xl border border-border-strong bg-surface p-5 text-fg backdrop:bg-black/60"
    >
      <h2 id={titleId} className="font-semibold text-base">
        {m.twitch_link_title()}
      </h2>
      <p id={bodyId} className="mt-2 text-fg-muted text-sm leading-relaxed">
        {m.twitch_link_body()}
      </p>
      <p className="mt-3 break-all rounded-lg bg-app px-3 py-2 font-mono text-xs">
        <span className="font-semibold text-fg">{url.host}</span>
        <span className="text-fg-muted">{url.pathname + url.search + url.hash}</span>
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancel}
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-strong"
        >
          {m.portability_cancel()}
        </button>
        <button
          type="button"
          onClick={open}
          className="rounded-lg bg-accent px-3 py-1.5 font-medium text-sm text-white"
        >
          {m.twitch_link_open()}
        </button>
      </div>
    </dialog>
  );
}
