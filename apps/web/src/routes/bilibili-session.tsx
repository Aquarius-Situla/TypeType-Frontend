import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { BiliBiliIcon } from "../components/bilibili-icon";
import { SessionPlatformNav } from "../components/session-platform-nav";
import { Toast } from "../components/toast";
import { useAuth } from "../hooks/use-auth";
import { useBiliBiliSession } from "../hooks/use-bilibili-session";
import { formatBilibiliSessionTime } from "../lib/bilibili-session-format";
import { sanitizeBilibiliSessionReturnTo } from "../lib/bilibili-session-route";
import { m } from "../paraglide/messages.js";

const SIDE_LABEL = "font-mono text-fg-soft text-[11px] uppercase tracking-[0.22em]";

function BiliBiliSessionPage() {
  const { authReady, isAuthed } = useAuth();
  const session = useBiliBiliSession();
  const { redirect } = Route.useSearch();
  const returnTo = sanitizeBilibiliSessionReturnTo(redirect);
  const state = session.status.data;
  const connected = state?.status === "connected";
  const daysLeft =
    state?.expiresAt && state.expiresAt > 0
      ? Math.ceil((state.expiresAt - Date.now()) / 86400000)
      : 0;
  const statusLabel = connected
    ? m.ui_bilibili_session_connected()
    : state?.status === "needs_reconnect"
      ? m.ui_bilibili_session_needs_reconnect()
      : m.ui_bilibili_session_not_connected();
  const statusDescription = connected ? m.ui_bilibili_session_description() : "";
  const qrActive = session.qrPhase === "waiting" || session.qrPhase === "scanned";
  const canStartQr = !connected && !qrActive && session.qrPhase !== "confirmed";

  useEffect(() => {
    if (session.qrPhase !== "confirmed" || !returnTo) return;
    const id = window.setTimeout(() => window.location.assign(returnTo), 900);
    return () => window.clearTimeout(id);
  }, [returnTo, session.qrPhase]);

  return (
    <div className="flex w-full max-w-none flex-col gap-8 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <Link to="/" className="w-fit text-fg-soft text-xs transition-colors hover:text-fg">
          {m.ui_back_home()}
        </Link>
        <SessionPlatformNav active="bilibili" />
      </div>

      <section className="grid min-h-[28rem] gap-10 border-border border-y py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col justify-center gap-8">
          <p className={SIDE_LABEL}>{m.ui_bilibili_remote_sign_in()}</p>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-4xl font-semibold text-3xl text-fg tracking-tight sm:text-5xl sm:leading-tight">
              {m.ui_connect_bilibili_inside_typetype()}
            </h1>
            <p className="max-w-3xl text-base text-fg-muted leading-7 sm:text-lg">
              {m.ui_typetype_generates_a_qr_code()}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {canStartQr && (
              <button
                type="button"
                onClick={session.startQr}
                disabled={!authReady || !isAuthed || session.qrPhase === "generating"}
                className="inline-flex h-11 w-full self-start items-center justify-center gap-2 border border-white bg-white px-5 font-medium text-black text-sm transition-colors hover:bg-fg disabled:opacity-50 sm:w-auto"
              >
                <BiliBiliIcon className="h-4 w-4 text-[#00a1d6]" />
                <span>
                  {session.qrPhase === "generating" ? m.ui_loading() : m.ui_connect_with_bilibili()}
                </span>
              </button>
            )}
            {session.qrUrl && (session.qrPhase === "waiting" || session.qrPhase === "scanned") && (
              <div className="flex w-full max-w-[18rem] flex-col gap-3 border-border border-l-2 pl-5">
                <p className="font-medium text-fg text-sm">{m.ui_bilibili_session_scan_qr()}</p>
                <div className="w-fit bg-white p-3">
                  <QRCodeSVG
                    value={session.qrUrl}
                    size={200}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#111111"
                    includeMargin
                    aria-label={m.ui_bilibili_session_scan_qr()}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={session.cancelQr}
                    className="h-10 w-fit border border-border-strong px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger"
                  >
                    {m.ui_bilibili_session_cancel()}
                  </button>
                  {session.qrPhase === "scanned" && (
                    <p className="font-medium text-emerald-600 text-xs dark:text-emerald-400">
                      {m.ui_bilibili_session_scanned()}
                    </p>
                  )}
                </div>
              </div>
            )}
            {session.qrPhase === ("confirmed" as const) && (
              <p className="font-medium text-emerald-600 text-sm dark:text-emerald-400">
                {m.ui_bilibili_session_connected_toast()}
              </p>
            )}
            {session.qrPhase === "expired" && (
              <div className="flex flex-col gap-2">
                <p className="text-amber-600 text-sm dark:text-amber-400">
                  {m.ui_bilibili_session_qr_expired()}
                </p>
                <button
                  type="button"
                  onClick={session.startQr}
                  className="w-fit text-fg text-sm underline"
                >
                  {m.ui_bilibili_session_try_again()}
                </button>
              </div>
            )}
            {session.qrPhase === "error" && (
              <div className="flex flex-col gap-2">
                <p className="text-danger text-sm">{session.qrError}</p>
                <button
                  type="button"
                  onClick={session.startQr}
                  className="w-fit text-fg text-sm underline"
                >
                  {m.ui_bilibili_session_retry()}
                </button>
              </div>
            )}
            <p className="max-w-2xl text-fg-muted text-sm leading-6">
              {m.ui_use_secondary_bilibili_account()}
            </p>
          </div>
        </div>

        <aside className="flex flex-col justify-center gap-5 border-border lg:border-l lg:pl-8">
          <div>
            <p className={SIDE_LABEL}>{m.admin_users_column_status()}</p>
            {session.status.isPending ? (
              <div className="mt-2 flex flex-col gap-2">
                <div className="h-7 w-28 animate-pulse rounded bg-surface-soft" />
                <div className="h-5 w-52 animate-pulse rounded bg-surface-soft" />
              </div>
            ) : (
              <>
                <p className="mt-2 font-semibold text-fg text-lg">{statusLabel}</p>
                {statusDescription && (
                  <p className="mt-2 text-fg-muted text-sm leading-6">{statusDescription}</p>
                )}
              </>
            )}
          </div>
          <dl className="flex flex-col gap-4 border-border border-t pt-5">
            {daysLeft > 0 && (
              <div>
                <dt className="text-fg-soft text-xs">{m.ui_bilibili_expires_at()}</dt>
                <dd className="mt-1 text-fg text-sm">{formatBilibiliSessionTime(state?.expiresAt)}</dd>
              </div>
            )}
            <div>
              <dt className="text-fg-soft text-xs">{m.ui_updated()}</dt>
              <dd className="mt-1 text-fg text-sm">
                {session.status.isPending ? (
                  <span className="inline-block h-4 w-28 animate-pulse rounded bg-surface-soft" />
                ) : (
                  formatBilibiliSessionTime(state?.updatedAt)
                )}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={
              session.status.isPending ||
              !authReady ||
              !isAuthed ||
              !connected ||
              session.disconnect.isPending
            }
            onClick={() => session.disconnect.mutate()}
            className="h-10 w-full border border-border-strong bg-transparent px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
          >
            {m.ui_disconnect()}
          </button>
        </aside>
      </section>

      <section className="grid gap-10 border-border border-b pb-10 lg:grid-cols-[18rem_1fr] xl:grid-cols-[22rem_1fr]">
        <div>
          <p className={SIDE_LABEL}>{m.ui_bilibili_what_happens()}</p>
          <p className="mt-2 text-fg-muted text-sm leading-6">{m.ui_bilibili_info_intro()}</p>
        </div>
        <ul className="flex flex-col gap-4 border-border border-l pl-5 text-fg-muted text-sm leading-6">
          <li>{m.ui_bilibili_info_scan()}</li>
          <li>{m.ui_bilibili_info_cookies()}</li>
          <li>{m.ui_bilibili_info_temporary()}</li>
          <li>{m.ui_bilibili_info_after()}</li>
        </ul>
      </section>

      <Toast
        message={
          session.qrPhase === ("confirmed" as const)
            ? m.ui_bilibili_session_connected_toast()
            : null
        }
      />
    </div>
  );
}

export const Route = createFileRoute("/bilibili-session")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: BiliBiliSessionPage,
});
