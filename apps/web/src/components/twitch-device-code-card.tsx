import { Check, Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  userCode: string;
  link: string;
  expiresAt: number;
  lifetimeMs: number;
  onCancel: () => void;
};

function remaining(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function TwitchDeviceCodeCard({ userCode, link, expiresAt, lifetimeMs, onCancel }: Props) {
  const [left, setLeft] = useState(() => remaining(expiresAt));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(remaining(expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(userCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const progress = lifetimeMs > 0 ? (left / lifetimeMs) * 100 : 0;
  return (
    <div className="flex max-w-3xl flex-col gap-5 border-border border-l-2 pl-5">
      <ol className="flex flex-col gap-1 text-fg-muted text-sm leading-6">
        <li>1. {m.ui_twitch_device_step_open()}</li>
        <li>2. {m.ui_twitch_device_step_code()}</li>
        <li>3. {m.ui_twitch_device_step_authorize()}</li>
      </ol>
      <div className="flex flex-wrap items-center gap-6">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={link} size={136} aria-label={m.ui_twitch_device_step_open()} />
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-mono text-3xl text-fg tracking-[0.2em]" aria-live="polite">
            {userCode}
          </span>
          <div className="flex flex-wrap gap-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#9146ff] px-4 font-medium text-sm text-white hover:bg-[#772ce8]"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {m.ui_twitch_device_open()}
            </a>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong px-4 text-fg text-sm hover:bg-surface-strong"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? m.ui_copied() : m.ui_twitch_device_copy()}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-surface-strong">
          <div
            className="h-full bg-[#9146ff] transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-fg-soft text-xs">
          {m.ui_twitch_device_expires_in({ time: clock(left) })} · {m.ui_device_login_waiting()}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 w-fit rounded-lg border border-border-strong px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger"
      >
        {m.ui_bilibili_session_cancel()}
      </button>
    </div>
  );
}
