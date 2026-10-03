import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChannelAvatar } from "../components/channel-avatar";
import { useChannelNotificationPreferences } from "../hooks/use-channel-notification-preferences";
import { useSettings } from "../hooks/use-settings";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { normalizeChannelUrl } from "../lib/channel-url";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

export function SettingsNotifications() {
  const { settings, update: updateSettings } = useSettings();
  const { query: subscriptionsQuery } = useSubscriptions();
  const preferences = useChannelNotificationPreferences();
  const [search, setSearch] = useState("");
  const [avatarWaitExpired, setAvatarWaitExpired] = useState(false);
  const avatarWaitStartedAt = useRef<number | null>(null);
  const subscriptions = subscriptionsQuery.data ?? [];
  const preferenceByUrl = useMemo(
    () =>
      new Map(
        (preferences.query.data ?? []).map((item) => [
          normalizeChannelUrl(item.channelUrl),
          item.enabled,
        ]),
      ),
    [preferences.query.data],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscriptions;
    return subscriptions.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.channelUrl.toLowerCase().includes(term),
    );
  }, [search, subscriptions]);
  const missingAvatarKey = useMemo(
    () =>
      subscriptions
        .filter((item) => !item.avatarUrl)
        .map((item) => normalizeChannelUrl(item.channelUrl))
        .join("\n"),
    [subscriptions],
  );

  useEffect(() => {
    if (!missingAvatarKey) {
      avatarWaitStartedAt.current = null;
      setAvatarWaitExpired(false);
      return;
    }
    avatarWaitStartedAt.current ??= Date.now();
    const elapsed = Date.now() - avatarWaitStartedAt.current;
    const remaining = Math.max(0, AVATAR_WAIT_TIMEOUT_MS - elapsed);
    if (remaining === 0) {
      setAvatarWaitExpired(true);
      return;
    }
    setAvatarWaitExpired(false);
    const interval = window.setInterval(() => {
      void subscriptionsQuery.refetch();
    }, AVATAR_REFRESH_INTERVAL_MS);
    const timeout = window.setTimeout(() => setAvatarWaitExpired(true), remaining);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [missingAvatarKey, subscriptionsQuery.refetch]);
  const showAvatarSkeleton = Boolean(missingAvatarKey) && !avatarWaitExpired;

  return (
    <section className="flex flex-col gap-3">
      <p className="px-1 text-xs font-medium text-fg-soft uppercase tracking-wider">
        {m.ui_notifications()}
      </p>
      <div className="border-y border-border">
        <div className={ROW}>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-fg">{m.ui_notification_popups()}</span>
            <span className="text-xs text-fg-soft">
              {m.ui_show_a_popup_when_a_subscribed_channel_publishes_a_video()}
            </span>
          </div>
          <ToggleSwitch
            checked={settings.notificationPopupsEnabled}
            onClick={() =>
              updateSettings.mutate({
                notificationPopupsEnabled: !settings.notificationPopupsEnabled,
              })
            }
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <div>
          <p className="text-sm font-medium text-fg">{m.settings_channel_notifications()}</p>
          <p className="mt-1 text-xs text-fg-soft">
            {m.settings_channel_notifications_description()}
          </p>
        </div>
        <label className="flex h-9 items-center gap-2 border border-border-strong bg-app px-2.5">
          <Search size={14} className="shrink-0 text-fg-soft" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m.settings_search_channels()}
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none"
          />
        </label>
        <div className="max-h-96 divide-y divide-border overflow-y-auto border-y border-border">
          {filtered.map((subscription) => (
            <div key={subscription.channelUrl} className={ROW}>
              <div className="flex min-w-0 items-center gap-3">
                <ChannelAvatar
                  src={proxyImage(subscription.avatarUrl)}
                  name={subscription.name}
                  className="h-8 w-8"
                  pending={showAvatarSkeleton && !subscription.avatarUrl}
                />
                <span className="truncate text-sm text-fg">{subscription.name}</span>
              </div>
              <ToggleSwitch
                checked={preferenceByUrl.get(normalizeChannelUrl(subscription.channelUrl)) ?? false}
                disabled={preferences.query.isLoading || preferences.update.isPending}
                onClick={() =>
                  preferences.update.mutate({
                    channelUrl: subscription.channelUrl,
                    enabled: !(
                      preferenceByUrl.get(normalizeChannelUrl(subscription.channelUrl)) ?? false
                    ),
                  })
                }
              />
            </div>
          ))}
          {!subscriptionsQuery.isLoading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-fg-soft">{m.ui_no_subscriptions_yet_2()}</p>
          )}
        </div>
      </div>
    </section>
  );
}

const AVATAR_REFRESH_INTERVAL_MS = 2_000;
const AVATAR_WAIT_TIMEOUT_MS = 15_000;
