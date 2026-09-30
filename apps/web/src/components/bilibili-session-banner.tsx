import { ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import { m } from "../paraglide/messages.js";
import { BiliBiliIcon } from "./bilibili-icon";
import { useBiliBiliSessionGate } from "./bilibili-session-gate";

export function BiliBiliSessionBanner() {
  const { connectHref, requiresConnection } = useBiliBiliSessionGate();
  const [dismissed, setDismissed] = useState(false);

  if (!requiresConnection || dismissed) return null;

  return (
    <div className="my-4 flex flex-col gap-3 rounded-lg border border-border bg-surface-soft/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
          <BiliBiliIcon className="size-4 text-[#00a1d6]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{m.ui_bilibili_quality_unlock_title()}</p>
          <p className="mt-0.5 text-xs leading-5 text-fg-muted">
            {m.ui_bilibili_quality_unlock_description()}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
        <a
          href={connectHref}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-fg px-3 text-xs font-medium text-app transition-colors hover:bg-fg-strong"
        >
          {m.ui_bilibili_session_connect()}
          <ArrowUpRight className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={m.ui_bilibili_quality_unlock_dismiss()}
          title={m.ui_bilibili_quality_unlock_dismiss()}
          className="flex size-9 items-center justify-center rounded-lg text-fg-soft transition-colors hover:bg-surface-strong hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
