import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { pollTwitchDevice, startTwitchDevice } from "../lib/api-twitch";
import { m } from "../paraglide/messages.js";
import type { TwitchDeviceCode } from "../types/twitch";
import { TwitchDeviceCodeCard } from "./twitch-device-code-card";
import { TwitchIcon } from "./twitch-icon";

type Props = {
  connected: boolean;
  onConnected: () => void;
};

type Device = TwitchDeviceCode & { expiresAt: number };

function activationLink(device: Device): string {
  return `${device.verificationUri}?device-code=${encodeURIComponent(device.userCode)}`;
}

export function TwitchDeviceLoginPanel({ connected, onConnected }: Props) {
  const [device, setDevice] = useState<Device | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!device) return;
    let cancelled = false;
    let delay = Math.max(device.interval, 5) * 1000;
    let timer: number;
    const tick = async () => {
      if (cancelled) return;
      if (Date.now() > device.expiresAt) {
        setDevice(null);
        setExpired(true);
        return;
      }
      try {
        const result = await pollTwitchDevice(device.deviceCode);
        if (cancelled) return;
        if (result.status === "ok") {
          setDevice(null);
          onConnected();
          return;
        }
        if (result.status === "slow_down") delay += 5000;
      } catch {
        if (!cancelled) {
          setDevice(null);
          setExpired(true);
        }
        return;
      }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [device, onConnected]);

  async function start() {
    setError(false);
    setExpired(false);
    setPending(true);
    try {
      const code = await startTwitchDevice();
      setDevice({ ...code, expiresAt: Date.now() + code.expiresIn * 1000 });
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (connected) {
    return (
      <div className="flex max-w-3xl flex-col items-start gap-4">
        <p className="text-fg-soft text-sm leading-6">{m.ui_twitch_session_connected_next()}</p>
        <Link
          to="/twitch"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#9146ff] px-4 font-medium text-sm text-white hover:bg-[#772ce8]"
        >
          <TwitchIcon className="size-4" />
          {m.ui_twitch_see_lives()}
        </Link>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="max-w-3xl border-border border-l-2 pl-5">
        <p className="text-fg text-sm leading-6">{m.ui_twitch_device_sign_in_hint()}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void start()}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-white bg-white px-5 font-medium text-black text-sm transition-colors hover:bg-fg disabled:opacity-50 sm:w-auto"
        >
          <TwitchIcon className="h-4 w-4 text-[#9146ff]" />
          <span>{pending ? m.ui_opening() : m.ui_connect_with_twitch()}</span>
        </button>
        {expired && (
          <p className="mt-3 text-danger-strong text-xs">{m.ui_twitch_device_expired()}</p>
        )}
        {error && (
          <p className="mt-3 text-danger-strong text-xs">{m.ui_twitch_device_sign_in_failed()}</p>
        )}
      </div>
    );
  }

  return (
    <TwitchDeviceCodeCard
      userCode={device.userCode}
      link={activationLink(device)}
      expiresAt={device.expiresAt}
      onCancel={() => setDevice(null)}
    />
  );
}
