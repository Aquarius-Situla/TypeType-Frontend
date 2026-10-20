import { useEffect, useState } from "react";
import type { YoutubeDeviceStart } from "../lib/api-youtube-session";
import { fetchYoutubeDeviceStatus } from "../lib/api-youtube-session";
import { m } from "../paraglide/messages.js";
import { YoutubeIcon } from "./youtube-icon";

type Props = {
  connected: boolean;
  pending: boolean;
  onStart: () => Promise<YoutubeDeviceStart>;
  onCancel: () => void;
  onConnected: () => void;
};

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function YoutubeDeviceLoginPanel({
  connected,
  pending,
  onStart,
  onCancel,
  onConnected,
}: Props) {
  const [device, setDevice] = useState<YoutubeDeviceStart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!device || expired) return;
    const intervalMs = Math.max(device.intervalSeconds, 5) * 1000;
    const timer = window.setInterval(() => {
      void fetchYoutubeDeviceStatus()
        .then((result) => {
          if (result.status === "connected") {
            setDevice(null);
            setError(null);
            onConnected();
          }
        })
        .catch(() => {
          setDevice(null);
          setExpired(true);
        });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [device, expired, onConnected]);

  useEffect(() => {
    if (!device) return;
    const timer = window.setTimeout(
      () => {
        setDevice(null);
        setExpired(true);
      },
      Math.max(device.expiresAt - Date.now(), 0),
    );
    return () => window.clearTimeout(timer);
  }, [device]);

  async function start() {
    setError(null);
    setExpired(false);
    try {
      setDevice(await onStart());
    } catch {
      setError(m.ui_remote_browser_connection_failed());
    }
  }

  if (connected) {
    return (
      <p className="max-w-3xl text-fg-soft text-sm leading-6">
        {m.ui_bilibili_session_connected()}
      </p>
    );
  }

  if (!device) {
    return (
      <div className="max-w-3xl border-border border-l-2 pl-5">
        <p className="text-fg text-sm leading-6">
          {m.ui_use_a_secondary_youtube_account_the_remote_browser_is_temporary_and_c()}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void start()}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-white bg-white px-5 font-medium text-black text-sm transition-colors hover:bg-fg disabled:opacity-50 sm:w-auto"
        >
          <YoutubeIcon className="h-4 w-4 text-[#ff0000]" />
          <span>{pending ? m.ui_opening() : m.ui_connect_with_youtube()}</span>
        </button>
        {expired && (
          <p className="mt-3 text-danger-strong text-xs">{m.ui_bilibili_session_qr_expired()}</p>
        )}
        {error && <p className="mt-3 text-danger-strong text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5 border-border border-l-2 pl-5">
      <p className="text-fg text-sm leading-6">{m.ui_enter_this_code_on_google_com_device()}</p>
      <a
        href={device.verificationUrl}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-2xl text-fg tracking-[0.18em] hover:underline"
      >
        {device.userCode}
      </a>
      <p className="text-fg-soft text-xs">
        {m.ui_bilibili_expires_at()} {formatExpiry(device.expiresAt)} ·{" "}
        {m.ui_device_login_waiting()}
      </p>
      <button
        type="button"
        onClick={() => {
          onCancel();
          setDevice(null);
        }}
        className="h-10 w-fit border border-border-strong px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger"
      >
        {m.ui_bilibili_session_cancel()}
      </button>
    </div>
  );
}
