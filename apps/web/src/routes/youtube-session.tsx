import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SessionPlatformNav } from "../components/session-platform-nav";
import { Toast } from "../components/toast";
import { YoutubeSessionBrowserPanel } from "../components/youtube-session-browser-panel";
import { YoutubeSessionInfoSection } from "../components/youtube-session-info-section";
import { YoutubeSessionStatusPanel } from "../components/youtube-session-status-panel";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useYoutubeRemoteBrowser } from "../hooks/use-youtube-remote-browser";
import { useYoutubeSession } from "../hooks/use-youtube-session";
import type { YoutubeRemoteBrowserSession } from "../lib/api-youtube-session";
import { recordClientEvent } from "../lib/client-debug-log";
import {
  sanitizeYoutubeSessionReturnTo,
  toYoutubeSessionWebSocketUrl,
} from "../lib/youtube-session-route";
import { m } from "../paraglide/messages.js";

const SIDE_LABEL = "font-mono text-fg-soft text-[11px] uppercase tracking-[0.22em]";

function YoutubeSessionPage() {
  const { returnTo } = Route.useSearch();
  const { authReady, isAuthed } = useAuth();
  const instance = useInstance();
  const session = useYoutubeSession();
  const [browserSession, setBrowserSession] = useState<YoutubeRemoteBrowserSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const state = session.status.data;
  const wsUrl = browserSession ? toYoutubeSessionWebSocketUrl(browserSession.wsUrl) : null;
  const remote = useYoutubeRemoteBrowser(wsUrl);
  const canDisconnect =
    authReady && isAuthed && state?.status !== "disconnected" && !session.disconnect.isPending;
  const connected = state?.status === "connected";
  const remoteLoginEnabled = instance.data?.youtubeRemoteLoginEnabled === true;

  const refetchStatus = session.status.refetch;

  useEffect(() => {
    if (remote.phase !== "connected") return;
    setBrowserSession(null);
    void refetchStatus();
    setToast(m.ui_youtube_session_connected());
  }, [remote.phase, refetchStatus]);

  function startRemoteBrowser() {
    recordClientEvent("youtube_remote.start_clicked", { hasReturnTo: !!returnTo });
    session.startBrowser.mutate(returnTo, {
      onSuccess: (next) => {
        recordClientEvent("youtube_remote.start_success", { expiresAt: next.expiresAt });
        setBrowserSession(next);
      },
      onError: (error) => {
        recordClientEvent("youtube_remote.start_error", {
          message: error instanceof Error ? error.message : "unknown",
        });
        setToast(m.ui_remote_youtube_login_is_not_available_yet());
      },
    });
  }

  function cancelRemoteBrowser() {
    recordClientEvent("youtube_remote.cancel_clicked");
    remote.send({ type: "cancel" });
    if (!browserSession) return;
    session.cancelBrowser.mutate(browserSession.sessionId, {
      onSettled: () => setBrowserSession(null),
    });
  }

  function disconnect() {
    session.disconnect.mutate(undefined, {
      onSuccess: () => setToast(m.ui_youtube_session_disconnected()),
      onError: () => setToast(m.ui_could_not_disconnect_youtube_session()),
    });
  }

  return (
    <div className="flex w-full max-w-none flex-col gap-8 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <Link to="/" className="w-fit text-fg-soft text-xs transition-colors hover:text-fg">
          {m.ui_back_home()}
        </Link>
        <SessionPlatformNav active="youtube" />
      </div>

      <section className="grid min-h-[28rem] gap-10 border-border border-y py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col justify-center gap-8">
          <p className={SIDE_LABEL}>{m.ui_youtube_remote_sign_in()}</p>

          <div className="flex flex-col gap-3">
            <h1 className="max-w-4xl font-semibold text-3xl text-fg tracking-tight sm:text-5xl sm:leading-tight">
              {m.ui_connect_youtube_inside_typetype()}
            </h1>
            <p className="max-w-3xl text-base text-fg-muted leading-7 sm:text-lg">
              {m.ui_typetype_opens_a_temporary_remote_browser_for_youtube_sign_in_cookies()}
            </p>
          </div>

          <YoutubeSessionBrowserPanel
            browserOpen={!!browserSession}
            authReady={authReady}
            isAuthed={isAuthed}
            enabled={remoteLoginEnabled}
            loaded={instance.isSuccess}
            pending={session.startBrowser.isPending}
            connected={connected}
            returnTo={returnTo}
            frameUrl={remote.frameUrl}
            phase={remote.phase}
            error={remote.error}
            logs={remote.logs}
            onStart={startRemoteBrowser}
            onCancel={cancelRemoteBrowser}
            onInput={remote.send}
            onLog={remote.log}
          />
        </div>

        <YoutubeSessionStatusPanel
          state={state}
          loading={session.status.isPending}
          canDisconnect={canDisconnect}
          onDisconnect={disconnect}
        />
      </section>

      <YoutubeSessionInfoSection labelClassName={SIDE_LABEL} />

      <Toast message={toast} />
    </div>
  );
}

export const Route = createFileRoute("/youtube-session")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: sanitizeYoutubeSessionReturnTo(search.returnTo),
  }),
  component: YoutubeSessionPage,
});
