import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { SessionPlatformNav } from "../components/session-platform-nav";
import { Toast } from "../components/toast";
import { TwitchDeviceLoginPanel } from "../components/twitch-device-login-panel";
import { TwitchDisabled } from "../components/twitch-grid";
import { TwitchSessionStatusPanel } from "../components/twitch-session-status-panel";
import { useAuth } from "../hooks/use-auth";
import { useTwitchAccount, useTwitchEnabled } from "../hooks/use-twitch";
import { unlinkTwitchAccount } from "../lib/api-twitch";
import { m } from "../paraglide/messages.js";

const SIDE_LABEL = "font-mono text-fg-soft text-[11px] uppercase tracking-[0.22em]";

const TWITCH_LOGIN = /^[A-Za-z0-9_]{1,25}$/;

function sanitizeChannel(value: unknown): string | undefined {
  return typeof value === "string" && TWITCH_LOGIN.test(value) ? value : undefined;
}

function TwitchSessionPage() {
  const { channel } = Route.useSearch();
  const navigate = useNavigate();
  const enabled = useTwitchEnabled();
  const { authReady, isAuthed, isGuest } = useAuth();
  const account = useTwitchAccount();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const connected = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["twitch"] });
    setToast(m.ui_twitch_session_connected());
    if (channel) void navigate({ to: "/twitch/watch", search: { c: channel } });
  }, [navigate, queryClient, channel]);

  async function disconnect() {
    setDisconnecting(true);
    try {
      await unlinkTwitchAccount();
      queryClient.setQueryData(["twitch", "account"], { linked: false });
      void queryClient.invalidateQueries({ queryKey: ["twitch"] });
      setToast(m.ui_twitch_session_disconnected());
    } catch {
      setToast(m.ui_twitch_session_disconnect_failed());
    } finally {
      setDisconnecting(false);
    }
  }

  if (!enabled) return <TwitchDisabled />;
  const signedIn = authReady && isAuthed && !isGuest;

  return (
    <div className="flex w-full max-w-none flex-col gap-8 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <Link to="/" className="w-fit text-fg-soft text-xs transition-colors hover:text-fg">
          {m.ui_back_home()}
        </Link>
        <SessionPlatformNav active="twitch" />
      </div>

      <section className="grid min-h-[28rem] gap-10 border-border border-y py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col justify-center gap-8">
          <p className={SIDE_LABEL}>{m.ui_twitch_device_sign_in()}</p>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-4xl font-semibold text-3xl text-fg tracking-tight sm:text-5xl sm:leading-tight">
              {m.ui_connect_twitch_inside_typetype()}
            </h1>
            <p className="max-w-3xl text-base text-fg-muted leading-7 sm:text-lg">
              {m.ui_twitch_device_sign_in_description()}
            </p>
          </div>
          {signedIn && (
            <TwitchDeviceLoginPanel
              connected={account.data?.linked === true}
              onConnected={connected}
            />
          )}
        </div>
        <TwitchSessionStatusPanel
          account={account.data}
          loading={signedIn && account.isPending}
          disconnecting={disconnecting}
          onDisconnect={() => void disconnect()}
        />
      </section>

      <Toast message={toast} />
    </div>
  );
}

export const Route = createFileRoute("/twitch-session")({
  validateSearch: (search: Record<string, unknown>) => ({
    channel: sanitizeChannel(search.channel),
  }),
  component: TwitchSessionPage,
});
