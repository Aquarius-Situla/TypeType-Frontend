import { Check, Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { m } from "../paraglide/messages.js";
import { DeviceLoginCountdown } from "./device-login-countdown";

type Props = {
  userCode: string;
  link: string;
  expiresAt: number;
  onCancel: () => void;
};

export function TwitchDeviceCodeCard({ userCode, link, expiresAt, onCancel }: Props) {
  const [copied, setCopied] = useState(false);

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
      <DeviceLoginCountdown expiresAt={expiresAt} barClassName="bg-[#9146ff]" />
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
