import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { m } from "../paraglide/messages.js";
import type { VideoStream } from "../types/stream";
import { ChannelAvatar } from "./channel-avatar";
import { ChannelRouteLink } from "./channel-route-link";
import { Toast } from "./toast";

type Props = {
  stream: VideoStream;
  className?: string;
};

export function ShortsInfoOverlay({ stream, className }: Props) {
  const { isAuthed } = useAuth();
  const { add, remove, isSubscribed } = useSubscriptions();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const subscribed = stream.channelUrl ? isSubscribed(stream.channelUrl) : false;

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 2000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  async function handleSubscribe() {
    if (!stream.channelUrl) return;
    if (!isAuthed) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    try {
      if (subscribed) {
        await remove.mutateAsync(stream.channelUrl);
        setToastMsg(m.ui_unsubscribed_from({ name: stream.channelName }));
        return;
      }
      await add.mutateAsync({
        channelUrl: stream.channelUrl,
        name: stream.channelName,
        avatarUrl: stream.channelAvatar,
      });
      setToastMsg(m.ui_subscribed_to({ name: stream.channelName }));
    } catch {
      setToastMsg(m.watch_subscription_failed());
    }
  }

  const overlayButtonClass = `ml-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
    subscribed
      ? "border border-border-strong bg-surface-strong text-fg hover:bg-surface-soft"
      : "bg-fg text-app hover:bg-white"
  }`;

  return (
    <div
      className={`shorts-info-overlay dark-surface pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-20 sm:px-4 sm:pb-4 ${className ?? ""}`}
    >
      <div className="max-w-[calc(100%-4.5rem)]">
        <div className="flex items-center gap-2">
          <ChannelLink url={stream.channelUrl}>
            <ChannelAvatar
              src={stream.channelAvatar}
              name={stream.channelName}
              className="h-9 w-9"
            />
          </ChannelLink>
          <ChannelLink url={stream.channelUrl}>
            <span className="line-clamp-1 text-sm font-medium text-white">
              {stream.channelName}
            </span>
          </ChannelLink>
          {stream.channelUrl && (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={add.isPending || remove.isPending}
              aria-pressed={subscribed}
              className={`${overlayButtonClass} pointer-events-auto`}
            >
              {subscribed ? m.watch_subscribed() : m.watch_subscribe()}
            </button>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-white/90">{stream.title}</p>
      </div>
      <Toast message={toastMsg} />
    </div>
  );
}

type ChannelLinkProps = {
  url?: string;
  children: React.ReactNode;
};

function ChannelLink({ url, children }: ChannelLinkProps) {
  if (!url) return <>{children}</>;
  return (
    <ChannelRouteLink url={url} className="pointer-events-auto hover:opacity-80 transition-opacity">
      {children}
    </ChannelRouteLink>
  );
}
